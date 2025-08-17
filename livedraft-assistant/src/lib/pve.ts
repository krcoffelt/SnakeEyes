import { Player, Weights, RosterCounts, TierMetrics, DraftedPlayer } from './types';
import { hashData, minmax01 } from './util';
import { getRoundAndPick } from './draftMath';

export interface PVEResult {
  PPS: { [playerName: string]: number };
  PVI: { [pos: string]: number };
  rosterNeeds: { [pos: string]: number };
  flexPressure: number;
  scarcityMetrics: { [pos: string]: { count: number; urgency: number } };
  tierUrgency: { [playerName: string]: number };
  availabilityRisk: { [playerName: string]: { risk: number; takeNow: boolean; makeItBack?: number } };
}

// Simple memo caches keyed by a light hash of remaining list
const marketValuesCache: Record<string, { [player: string]: number }> = {};
const talentScoresCache: Record<string, { [player: string]: number }> = {};

export function computePVE(
  remaining: Player[],
  weights: Weights,
  nextPicks: [number, number],
  myRoster: RosterCounts,
  _tierMetrics: TierMetrics,
  _tierDropThreshold: number,
  availabilityS: number,
  picksUntilUser: number,
  currentOverall: number,
  config: { teams: number; flexCount: 1 | 2; ppr: 'PPR' | 'Half PPR' | 'Standard' },
  slot: number,
  draftedAll: DraftedPlayer[]
): PVEResult {
  if (remaining.length === 0) {
    return {
      PPS: {},
      PVI: {},
      rosterNeeds: {},
      flexPressure: 0,
      scarcityMetrics: {},
      tierUrgency: {},
      availabilityRisk: {}
    };
  }

  const remainingHash = hashRemaining(remaining);

  // 1. Compute Market Value (z-score of value across remaining)
  const marketValuesRaw = marketValuesCache[remainingHash] || (marketValuesCache[remainingHash] = computeMarketValue(remaining));
  
  // 2. Compute Talent (inverse of normalized blend_rank)
  const talentScores = talentScoresCache[remainingHash] || (talentScoresCache[remainingHash] = computeTalent(remaining));
  
  // 3. Compute Positional Scarcity (window = picksUntilUser)
  const scarcityRaw = computeScarcity(remaining, picksUntilUser, currentOverall, config.teams);
  
  // 4. Compute Roster Needs with FLEX Logic
  const { rosterNeeds: rosterNeedsRaw, flexPressure } = computeRosterNeeds(myRoster, config);
  
  // 5. Compute Tier Urgency (dynamic per-position thresholds)
  const tierUrgencyRaw = computeTierUrgencyDynamic(remaining, currentOverall, config.teams);
  
  // Normalize components to stabilize PPS across phases
  const marketValues = normalizePlayerMap(remaining, marketValuesRaw);
  const tierUrgency = normalizePlayerMap(remaining, tierUrgencyRaw);
  const rosterNeeds = normalizePosMapToPlayers(remaining, rosterNeedsRaw);
  const scarcityMetrics = normalizeScarcityPos(remaining, scarcityRaw);
  
  // 6. Compute Availability Risk (user-centric baseline) and opponent-aware make-it-back
  const availabilityRaw = computeAvailabilityRisk(remaining, nextPicks, availabilityS, config.teams, currentOverall);
  const makeItBack = computeOpponentMakeItBack(
    remaining,
    draftedAll,
    config.teams,
    slot,
    currentOverall,
    nextPicks[0],
    marketValues,
    tierUrgency,
    scarcityMetrics,
    weights,
    { ppr: config.ppr, flexCount: config.flexCount }
  );
  // Attach makeItBack to availability map (do not normalize)
  Object.keys(availabilityRaw).forEach(name => {
    availabilityRaw[name].makeItBack = makeItBack[name] ?? undefined;
  });

  // 7. Compute Player Priority Scores
  const PPS = computePPS(
    remaining,
    weights,
    marketValues,
    talentScores,
    tierUrgency,
    rosterNeeds,
    scarcityMetrics,
    availabilityRaw,
    { ppr: config.ppr }
  );
  
  // 8. Compute Positional Value Index
  const PVI = computePVI(remaining, PPS);
  
  return {
    PPS,
    PVI,
    rosterNeeds: rosterNeedsRaw,
    flexPressure,
    scarcityMetrics: scarcityRaw,
    tierUrgency: tierUrgencyRaw,
    availabilityRisk: availabilityRaw
  };
}

function hashRemaining(remaining: Player[]): string {
  const lite = remaining.map(p => [p.player, p.und_adp ?? null, p.slp_rank ?? null, p.blend_rank ?? null, p.value ?? null]);
  return hashData(lite);
}

function computeMarketValue(remaining: Player[]): { [playerName: string]: number } {
  const values = remaining
    .map(p => p.value)
    .filter((v): v is number => v !== null && v !== undefined);
  if (values.length === 0) return {};
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const result: { [playerName: string]: number } = {};
  remaining.forEach(player => {
    if (player.value !== null && player.value !== undefined) {
      const zScore = stdDev === 0 ? 0 : (player.value - mean) / stdDev;
      const clipped = Math.max(-2, Math.min(2, zScore));
      result[player.player] = (clipped + 2) / 4;
    } else {
      result[player.player] = 0.5;
    }
  });
  return result;
}

function computeTalent(remaining: Player[]): { [playerName: string]: number } {
  const ranks = remaining
    .map(p => p.blend_rank)
    .filter((r): r is number => r !== null && r !== undefined);
  if (ranks.length === 0) return {};
  const minRank = Math.min(...ranks);
  const maxRank = Math.max(...ranks);
  const range = maxRank - minRank;
  const result: { [playerName: string]: number } = {};
  remaining.forEach(player => {
    if (player.blend_rank !== null && player.blend_rank !== undefined) {
      result[player.player] = range > 0 ? (maxRank - player.blend_rank) / range : 0.5;
    } else {
      result[player.player] = 0.5;
    }
  });
  return result;
}

function blendedPick(p: Player): number | null {
  const u = p.und_adp ?? null;
  const s = p.slp_rank ?? null;
  const r = p.ron_rank ?? null;
  // Prefer Underdog ADP; lightly blend in Sleeper; very light Ron if only Ron exists
  if (u !== null && s !== null) return 0.7 * u + 0.3 * s;
  if (u !== null) return u;
  if (s !== null) return s;
  if (r !== null) return r; // last resort
  return null;
}

function computeScarcity(
  remaining: Player[],
  picksUntilUser: number,
  currentOverall: number,
  teams: number
): { [pos: string]: { count: number; urgency: number } } {
  const positions = ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'];
  const result: { [pos: string]: { count: number; urgency: number } } = {};
  const windowUpper = currentOverall + Math.max(0, picksUntilUser);
  const denom = Math.max(1, Math.min(picksUntilUser, teams));
  positions.forEach(pos => {
    const posPlayers = remaining.filter(p => p.pos === pos);
    const count = posPlayers.length;
    const inWindow = posPlayers.filter(p => {
      const bp = blendedPick(p);
      return bp !== null && bp <= windowUpper;
    }).length;
    const urgency = Math.max(0, 1 - (inWindow / denom));
    result[pos] = { count, urgency };
  });
  return result;
}

function computeRosterNeeds(
  myRoster: RosterCounts, 
  config: { flexCount: 1 | 2; ppr: 'PPR' | 'Half PPR' | 'Standard' }
): { rosterNeeds: { [pos: string]: number }; flexPressure: number } {
  const rosterNeeds: { [pos: string]: number } = {};
  const baseRequirements = { QB: 1, RB: 2, WR: 2, TE: 1, DEF: 1, K: 1 } as const;

  const totalStarters = baseRequirements.QB + baseRequirements.RB + baseRequirements.WR + baseRequirements.TE + baseRequirements.DEF + baseRequirements.K + config.flexCount;
  const draftedTotal = myRoster.total || 0;
  const earlyPhase = draftedTotal < Math.ceil(totalStarters / 2);
  const benchPhase = draftedTotal >= totalStarters;

  // Combined RB/WR needs including FLEX
  const combinedRequiredRBWR = baseRequirements.RB + baseRequirements.WR + config.flexCount; // 4 + flex
  const currentRBWR = (myRoster.RB || 0) + (myRoster.WR || 0);
  const combinedFraction = Math.max(0, Math.min(1, (combinedRequiredRBWR - currentRBWR) / combinedRequiredRBWR));

  // Individual base fractions for RB/WR toward starter requirements
  const rbBaseNeed = Math.max(0, Math.min(1, (baseRequirements.RB - (myRoster.RB || 0)) / baseRequirements.RB));
  const wrBaseNeed = Math.max(0, Math.min(1, (baseRequirements.WR - (myRoster.WR || 0)) / baseRequirements.WR));

  // RB need: combine individual starter deficit with shared FLEX deficit
  let rbNeed = Math.max(rbBaseNeed, 0.5 * combinedFraction);
  // WR need: combine individual starter deficit with shared FLEX deficit
  let wrNeed = Math.max(wrBaseNeed, 0.5 * combinedFraction);

  // Bench-aware slight bias to RB/WR once starters+FLEX are satisfied
  if (benchPhase) {
    rbNeed = Math.max(rbNeed, 0.1);
    wrNeed = Math.max(wrNeed, 0.1);
  }

  // PPR nuance: elevate WR/TE slightly in PPR/Half PPR
  if (config.ppr === 'PPR') {
    wrNeed += 0.05;
  } else if (config.ppr === 'Half PPR') {
    wrNeed += 0.02;
  }

  // Phase sensitivity: in early/mid phases, favor RB/WR slightly; push K/DEF late
  if (earlyPhase) {
    rbNeed += 0.03;
    wrNeed += 0.03;
  }

  // Clamp RB/WR
  rosterNeeds.RB = Math.max(0, Math.min(1, rbNeed));
  rosterNeeds.WR = Math.max(0, Math.min(1, wrNeed));

  // QB need: single-start dampening until bench phase
  const qbCurrent = myRoster.QB || 0;
  if (qbCurrent >= baseRequirements.QB) {
    rosterNeeds.QB = benchPhase ? 0.05 : 0.0;
  } else {
    rosterNeeds.QB = 1 - qbCurrent / baseRequirements.QB; // 1 if none
  }

  // TE need: similar dampening
  const teCurrent = myRoster.TE || 0;
  if (teCurrent >= baseRequirements.TE) {
    rosterNeeds.TE = benchPhase ? 0.05 : 0.0;
  } else {
    rosterNeeds.TE = 1 - teCurrent / baseRequirements.TE;
  }

  // DEF/K: prefer late; only start to appear in bench/late phases
  const defCurrent = myRoster.DEF || 0;
  const kCurrent = myRoster.K || 0;
  if (defCurrent >= baseRequirements.DEF) {
    rosterNeeds.DEF = benchPhase ? 0.05 : 0.0;
  } else {
    rosterNeeds.DEF = benchPhase ? 0.3 : (earlyPhase ? 0.0 : 0.1);
  }
  if (kCurrent >= baseRequirements.K) {
    rosterNeeds.K = benchPhase ? 0.05 : 0.0;
  } else {
    rosterNeeds.K = benchPhase ? 0.3 : (earlyPhase ? 0.0 : 0.1);
  }

  // Flex pressure (normalized): how much RB/WR capacity remains relative to FLEX
  const flexRemaining = Math.max(0, combinedRequiredRBWR - currentRBWR);
  const flexPressure = Math.max(0, Math.min(1, flexRemaining / Math.max(1, config.flexCount)));

  return { rosterNeeds, flexPressure };
}

function computeTierUrgencyDynamic(
  remaining: Player[],
  currentOverall: number,
  teams: number
): { [playerName: string]: number } {
  const result: { [playerName: string]: number } = {};
  const positions = ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'];

  // Draft phase estimate 0..1
  const totalPicksApprox = teams * 15;
  const phase = Math.max(0, Math.min(1, currentOverall / totalPicksApprox));

  positions.forEach(pos => {
    const posPlayers = remaining.filter(p => p.pos === pos && p.blend_rank !== null && p.tier !== null);
    if (posPlayers.length === 0) return;
    // group by tier
    const groups = new Map<number, Player[]>();
    posPlayers.sort((a, b) => (a.blend_rank! - b.blend_rank!));
    posPlayers.forEach(p => {
      const t = p.tier!;
      if (!groups.has(t)) groups.set(t, []);
      groups.get(t)!.push(p);
    });

    const tiers = Array.from(groups.keys()).sort((a, b) => a - b);
    const gaps: number[] = [];
    const gapByTier = new Map<number, number>();

    tiers.forEach((t, idx) => {
      const tierPlayers = groups.get(t)!;
      const last = tierPlayers[tierPlayers.length - 1];
      if (idx < tiers.length - 1) {
        const nextTier = groups.get(tiers[idx + 1])!;
        const firstNext = nextTier[0];
        const gap = (firstNext.blend_rank! - last.blend_rank!);
        gapByTier.set(t, gap);
        gaps.push(gap);
      } else {
        gapByTier.set(t, 0);
      }
    });

    const threshold = dynamicGapThreshold(gaps, phase);

    posPlayers.forEach(p => {
      const g = gapByTier.get(p.tier!) ?? 0;
      const isLast = groups.get(p.tier!)?.slice(-1)[0]?.player === p.player;
      if (!isLast) { result[p.player] = 0; return; }
      if (g >= threshold) result[p.player] = 1;
      else if (g >= threshold * 0.5) result[p.player] = 0.7;
      else result[p.player] = 0.3;
    });
  });

  return result;
}

function dynamicGapThreshold(gaps: number[], phase: number): number {
  if (gaps.length === 0) return 8; // fallback
  const sorted = [...gaps].sort((a, b) => a - b);
  const q = percentile(sorted, 0.75); // 75th percentile
  // Phase adjustment: earlier rounds lower threshold, later rounds slightly higher
  const adj = q * (phase < 0.33 ? 0.85 : phase > 0.66 ? 1.1 : 1.0);
  return Math.max(4, adj);
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = (sortedAsc.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo);
}

function computeAvailabilityRisk(
  remaining: Player[], 
  nextPicks: [number, number], 
  baseS: number,
  teams: number,
  currentOverall: number
): { [playerName: string]: { risk: number; takeNow: boolean; makeItBack?: number } } {
  const result: { [playerName: string]: { risk: number; takeNow: boolean; makeItBack?: number } } = {};
  const nextPick = Math.min(...nextPicks);
  const totalPicksApprox = teams * 15;
  const phase = Math.max(0, Math.min(1, currentOverall / totalPicksApprox));
  const s = baseS + Math.round(4 * phase);
  remaining.forEach(player => {
    const bp = blendedPick(player);
    if (bp === null) { result[player.player] = { risk: 0.5, takeNow: false }; return; }
    // Ron target round adjustment (convert 12-team target round to T-team overall pick)
    let takeNowBias = 0;
    if (player.ron_target_round_12 != null) {
      const targetOverall12 = 12 * (player.ron_target_round_12 - 1) + 6.5; // middle of round
      const targetOverallT = targetOverall12 * (teams / 12);
      if (currentOverall >= targetOverallT) {
        takeNowBias = 0.1; // small bump when at/after target
      } else if (targetOverallT - currentOverall <= teams) {
        takeNowBias = 0.05; // within ~1 round
      }
    }
    const delta = nextPick - bp;
    const availProb = 1 / (1 + Math.exp(-delta / s));
    let risk = 1 - availProb + takeNowBias;
    risk = Math.max(0, Math.min(1, risk));
    const takeNow = bp <= nextPick || takeNowBias >= 0.1;
    result[player.player] = { risk, takeNow };
  });
  return result;
}

function computeOpponentMakeItBack(
  remaining: Player[],
  drafted: DraftedPlayer[],
  teams: number,
  userSlot: number,
  currentOverall: number,
  nextUserPickOverall: number,
  marketValues: { [player: string]: number },
  tierUrgency: { [player: string]: number },
  scarcity: { [pos: string]: { count: number; urgency: number } },
  weights: Weights,
  config: { ppr: 'PPR' | 'Half PPR' | 'Standard'; flexCount: 1 | 2 }
): { [playerName: string]: number } {
  const start = currentOverall;
  const end = Math.max(currentOverall, nextUserPickOverall - 1);
  if (end < start) {
    const out: { [name: string]: number } = {};
    remaining.forEach(p => { out[p.player] = 1; });
    return out; // no intervening picks
  }

  // Draft phase 0..1 to modulate aggressiveness (earlier rounds more ADP-driven)
  const totalPicksApprox = teams * 15;
  const phase = Math.max(0, Math.min(1, currentOverall / totalPicksApprox));

  // Build team rosters from drafted history
  const rosters: Record<number, RosterCounts> = {};
  for (let t = 1; t <= teams; t++) {
    rosters[t] = { QB: 0, RB: 0, WR: 0, TE: 0, DEF: 0, K: 0, total: 0 };
  }
  drafted.forEach(d => {
    const odd = d.round % 2 === 1;
    const col = odd ? d.pick : (teams - d.pick + 1);
    const pos = d.pos as keyof RosterCounts;
    if (pos && rosters[col]) {
      if (pos === 'QB' || pos === 'RB' || pos === 'WR' || pos === 'TE' || pos === 'DEF' || pos === 'K') {
        (rosters[col][pos] as number)++;
        rosters[col].total++;
      }
    }
  });

  // Determine intervening team slots and their pick overall between now and next user pick
  const intervening: Array<{ teamSlot: number; ovPick: number }> = [];
  for (let ov = start; ov <= end; ov++) {
    const { round, pickInRound } = getRoundAndPick(ov, teams);
    const isOdd = round % 2 === 1;
    const col = isOdd ? pickInRound : (teams - pickInRound + 1);
    if (col !== userSlot) intervening.push({ teamSlot: col, ovPick: ov });
  }

  const out: { [name: string]: number } = {};
  remaining.forEach(p => { out[p.player] = 1; });

  // Precompute per-position scarcity urgency
  const posUrgency: Record<string, number> = {};
  Object.keys(scarcity).forEach(pos => { posUrgency[pos] = scarcity[pos]?.urgency ?? 0; });

  // Softer temperature yields more peaked choices around top options
  const tau = 0.28;
  // Stronger ADP weight; early rounds more ADP-driven
  const baseAdpWeight = 1.2 + (1 - phase) * 0.3; // up to 1.5 early

  intervening.forEach(({ teamSlot, ovPick }) => {
    const { rosterNeeds: needs } = computeRosterNeeds(rosters[teamSlot], { flexCount: config.flexCount, ppr: config.ppr });

    // Candidate window around current pick based only on Sleeper ADP
    const windowPicks = Math.max(Math.round(teams * (0.6 + phase * 1.2)), Math.floor(teams / 2)); // ~0.6R early to ~1.8R late
    const candidates = remaining.filter(p => {
      const adp = p.slp_rank ?? null;
      if (adp === null) return false;
      return adp <= ovPick + windowPicks;
    });
    // Ensure we always have at least a handful of options by backfilling best by Sleeper ADP
    const minCandidates = 12;
    if (candidates.length < minCandidates) {
      const fill = [...remaining]
        .filter(p => !candidates.includes(p) && p.slp_rank != null)
        .sort((a, b) => (a.slp_rank as number) - (b.slp_rank as number))
        .slice(0, minCandidates - candidates.length);
      candidates.push(...fill);
    }

    // Build scores for candidates
    const scores: number[] = [];
    const names: string[] = [];
    for (let i = 0; i < candidates.length; i++) {
      const p = candidates[i];
      const pos = p.pos || '';
      names.push(p.player);
      const mv = marketValues[p.player] || 0;
      const tu = tierUrgency[p.player] || 0;
      const sc = pos ? (posUrgency[pos] || 0) : 0;
      const need = pos ? (needs[pos] || 0) : 0;

      // Sleeper ADP only
      const adpRef = p.slp_rank ?? null;
      // If missing SLP ADP (rare), treat as neutral 0.5 signal
      const sAdp = Math.max(2, Math.round(teams / 4)) + phase * 3; // ~2-3 early, ~5-6 later
      const adpSig = adpRef != null ? (1 / (1 + Math.exp(-(ovPick - adpRef) / sAdp))) : 0.5;
      const pastDueBoost = adpRef != null && adpRef <= ovPick ? 0.3 : 0;

      // Early-round positional priors (RB/WR more likely; TE slightly; QB/DEF/K less)
      const early = (1 - phase);
      let posPrior = 0;
      if (pos === 'RB' || pos === 'WR') posPrior += 0.12 * early;
      else if (pos === 'TE') posPrior += 0.04 * early;
      else if (pos === 'QB') posPrior -= 0.08 * early;
      else if (pos === 'DEF' || pos === 'K') posPrior -= 0.15 * early;

      let score = 0;
      score += weights.w_value * mv;
      score += weights.w_tier * tu;
      score += weights.w_scar * sc;
      score += weights.w_need * need;
      score += (1.2 + (1 - phase) * 0.3) * adpSig + pastDueBoost; // stronger SLP ADP early
      score += posPrior;
      if (config.ppr === 'PPR' && (pos === 'WR' || pos === 'TE')) score += 0.04;
      else if (config.ppr === 'Half PPR' && (pos === 'WR' || pos === 'TE')) score += 0.02;
      if (pos === 'RB' || pos === 'WR') score += 0.02;
      if (p.isRookie) score += 0.03;
      scores.push(Math.max(0, score));
    }

    // Softmax over narrowed candidate set
    const expVals = scores.map(s => Math.exp(s / Math.max(0.001, tau)));
    const denom = expVals.reduce((s, v) => s + v, 0) || 1;
    const probs = expVals.map(v => v / denom);

    // Update make-it-back probabilities for these players
    for (let j = 0; j < candidates.length; j++) {
      const name = names[j];
      const pPick = probs[j];
      out[name] = out[name] * (1 - pPick);
    }
  });

  return out;
}

function normalizePlayerMap(remaining: Player[], map: { [player: string]: number }): { [player: string]: number } {
  const vals = remaining.map(p => map[p.player] ?? 0);
  const scaled = minmax01(vals);
  const out: { [player: string]: number } = {};
  remaining.forEach((p, i) => { out[p.player] = scaled[i]; });
  return out;
}

function normalizeAvailability(remaining: Player[], map: { [player: string]: { risk: number; takeNow: boolean; makeItBack?: number } }): { [player: string]: { risk: number; takeNow: boolean; makeItBack?: number } } {
  const risks = remaining.map(p => map[p.player]?.risk ?? 0.5);
  const scaled = minmax01(risks);
  const out: { [player: string]: { risk: number; takeNow: boolean; makeItBack?: number } } = {};
  remaining.forEach((p, i) => { out[p.player] = { risk: scaled[i], takeNow: map[p.player]?.takeNow ?? false, makeItBack: map[p.player]?.makeItBack }; });
  return out;
}

function normalizePosMapToPlayers(remaining: Player[], posMap: { [pos: string]: number }): { [pos: string]: number } {
  const positions = Array.from(new Set(remaining.map(p => p.pos).filter(Boolean))) as string[];
  const vals = positions.map(pos => posMap[pos] ?? 0);
  const scaled = minmax01(vals);
  const outPos: { [pos: string]: number } = {};
  positions.forEach((pos, i) => { outPos[pos] = scaled[i]; });
  return outPos;
}

function normalizeScarcityPos(remaining: Player[], scarcity: { [pos: string]: { count: number; urgency: number } }): { [pos: string]: { count: number; urgency: number } } {
  const positions = Array.from(new Set(remaining.map(p => p.pos).filter(Boolean))) as string[];
  const urgVals = positions.map(pos => scarcity[pos]?.urgency ?? 0);
  const scaled = minmax01(urgVals);
  const out: { [pos: string]: { count: number; urgency: number } } = {};
  positions.forEach((pos, i) => { out[pos] = { count: scarcity[pos]?.count ?? 0, urgency: scaled[i] }; });
  return out;
}

function computePPS(
  remaining: Player[],
  weights: Weights,
  marketValues: { [playerName: string]: number },
  talentScores: { [playerName: string]: number },
  tierUrgency: { [playerName: string]: number },
  rosterNeeds: { [pos: string]: number },
  scarcityMetrics: { [pos: string]: { count: number; urgency: number } },
  availabilityRisk: { [playerName: string]: { risk: number; takeNow: boolean; makeItBack?: number } },
  config: { ppr: 'PPR' | 'Half PPR' | 'Standard' }
): { [playerName: string]: number } {
  const result: { [playerName: string]: number } = {};
  remaining.forEach(player => {
    const pos = player.pos;
    if (!pos) { result[player.player] = 0; return; }
    let pps = 0;
    pps += weights.w_value * (marketValues[player.player] || 0);
    pps += weights.w_tier * (tierUrgency[player.player] || 0);
    pps += weights.w_need * (rosterNeeds[pos] || 0);
    const scarcity = scarcityMetrics[pos];
    if (scarcity) pps += weights.w_scar * scarcity.urgency;
    const availability = availabilityRisk[player.player];
    if (availability) pps += weights.w_avail * availability.risk;
    // Additive small boosts
    if (config.ppr === 'PPR' && (pos === 'WR' || pos === 'TE')) pps += 0.06;
    else if (config.ppr === 'Half PPR' && (pos === 'WR' || pos === 'TE')) pps += 0.03;
    if (pos === 'RB' || pos === 'WR') pps += 0.03; // FLEX-friendly
    if (player.isRookie) pps += 0.05;
    result[player.player] = Math.max(0, Math.min(1, pps));
  });
  return result;
}

function computePVI(remaining: Player[], PPS: { [playerName: string]: number }): { [pos: string]: number } {
  const positions = ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'];
  const result: { [pos: string]: number } = {};
  positions.forEach(pos => {
    const posPlayers = remaining.filter(p => p.pos === pos);
    if (posPlayers.length === 0) { result[pos] = 0; return; }
    const k = Math.min(6, posPlayers.length);
    const topPPS = posPlayers.map(p => PPS[p.player] || 0).sort((a, b) => b - a).slice(0, k);
    const meanPPS = topPPS.reduce((sum, pps) => sum + pps, 0) / k;
    result[pos] = meanPPS;
  });
  const maxPVI = Math.max(...Object.values(result));
  if (maxPVI > 0) Object.keys(result).forEach(pos => { result[pos] = result[pos] / maxPVI; });
  return result;
} 