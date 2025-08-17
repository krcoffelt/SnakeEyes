import { Player, Weights, RosterCounts, TierMetrics } from './types';
import { hashData, minmax01 } from './util';

export interface PVEResult {
  PPS: { [playerName: string]: number };
  PVI: { [pos: string]: number };
  rosterNeeds: { [pos: string]: number };
  flexPressure: number;
  scarcityMetrics: { [pos: string]: { count: number; urgency: number } };
  tierUrgency: { [playerName: string]: number };
  availabilityRisk: { [playerName: string]: { risk: number; takeNow: boolean } };
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
  config: { teams: number; flexCount: 1 | 2; ppr: 'PPR' | 'Half PPR' | 'Standard' }
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
  
  // 6. Compute Availability Risk (use blended pick and phase-aware S)
  const availabilityRaw = computeAvailabilityRisk(remaining, nextPicks, availabilityS, config.teams, currentOverall);

  // Normalize components to stabilize PPS across phases
  const marketValues = normalizePlayerMap(remaining, marketValuesRaw);
  const tierUrgency = normalizePlayerMap(remaining, tierUrgencyRaw);
  const availabilityRisk = normalizeAvailability(remaining, availabilityRaw);
  const rosterNeeds = normalizePosMapToPlayers(remaining, rosterNeedsRaw);
  const scarcityMetrics = normalizeScarcityPos(remaining, scarcityRaw);
  
  // 7. Compute Player Priority Scores
  const PPS = computePPS(
    remaining,
    weights,
    marketValues,
    talentScores,
    tierUrgency,
    rosterNeeds,
    scarcityMetrics,
    availabilityRisk,
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
  if (u === null && s === null) return null;
  if (u !== null && s !== null) return 0.7 * u + 0.3 * s;
  return (u ?? s)!;
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
  const flexRequirements = { RB: config.flexCount === 2 ? 1 : 0, WR: config.flexCount === 2 ? 1 : 0 } as const;
  (Object.keys(baseRequirements) as Array<keyof typeof baseRequirements>).forEach(pos => {
    const current = myRoster[pos] || 0;
    const totalRequired = baseRequirements[pos] + (flexRequirements[pos as 'RB' | 'WR'] || 0);
    if (current >= totalRequired) rosterNeeds[pos] = 0; else if (current === 0) rosterNeeds[pos] = 1; else rosterNeeds[pos] = 0.5;
  });
  const totalRBWR = myRoster.RB + myRoster.WR;
  const flexTarget = 4 + config.flexCount;
  const flexPressure = Math.max(0, flexTarget - totalRBWR) / config.flexCount;
  if (flexPressure > 0) {
    rosterNeeds.RB = Math.max(rosterNeeds.RB, flexPressure);
    rosterNeeds.WR = Math.max(rosterNeeds.WR, flexPressure);
  }
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
): { [playerName: string]: { risk: number; takeNow: boolean } } {
  const result: { [playerName: string]: { risk: number; takeNow: boolean } } = {};
  const nextPick = Math.min(...nextPicks);
  const totalPicksApprox = teams * 15;
  const phase = Math.max(0, Math.min(1, currentOverall / totalPicksApprox));
  const s = baseS + Math.round(4 * phase);
  remaining.forEach(player => {
    const bp = blendedPick(player);
    if (bp === null) { result[player.player] = { risk: 0.5, takeNow: false }; return; }
    const delta = nextPick - bp;
    const availProb = 1 / (1 + Math.exp(-delta / s));
    const risk = 1 - availProb;
    const takeNow = bp <= nextPick;
    result[player.player] = { risk, takeNow };
  });
  return result;
}

function normalizePlayerMap(remaining: Player[], map: { [player: string]: number }): { [player: string]: number } {
  const vals = remaining.map(p => map[p.player] ?? 0);
  const scaled = minmax01(vals);
  const out: { [player: string]: number } = {};
  remaining.forEach((p, i) => { out[p.player] = scaled[i]; });
  return out;
}

function normalizeAvailability(remaining: Player[], map: { [player: string]: { risk: number; takeNow: boolean } }): { [player: string]: { risk: number; takeNow: boolean } } {
  const risks = remaining.map(p => map[p.player]?.risk ?? 0.5);
  const scaled = minmax01(risks);
  const out: { [player: string]: { risk: number; takeNow: boolean } } = {};
  remaining.forEach((p, i) => { out[p.player] = { risk: scaled[i], takeNow: map[p.player]?.takeNow ?? false }; });
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
  availabilityRisk: { [playerName: string]: { risk: number; takeNow: boolean } },
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