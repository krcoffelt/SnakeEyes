import { Player, Weights, RosterCounts, AvailabilityRisk, PositionalValueIndex, PlayerPriorityScore } from './types';
import { zscoreClip01, minmax01, clamp01 } from './util';
import { calculateTierUrgency } from './tiers';

/**
 * Compute market value based on value (Sleeper rank - Underdog rank)
 * Uses z-score clipping to [0,1] range
 */
export function computeMarketValue(remaining: Player[]): Map<string, number> {
  const values = remaining
    .filter(p => p.value !== null && p.value !== undefined)
    .map(p => p.value!);
  
  if (values.length === 0) {
    return new Map(remaining.map(p => [p.player, 0.5]));
  }
  
  const normalizedValues = zscoreClip01(values);
  const result = new Map<string, number>();
  
  remaining.forEach((player, index) => {
    if (player.value !== null && player.value !== undefined) {
      const valueIndex = values.indexOf(player.value);
      result.set(player.player, normalizedValues[valueIndex] || 0.5);
    } else {
      result.set(player.player, 0.5); // Default for players without value
    }
  });
  
  return result;
}

/**
 * Compute talent score based on inverse of normalized blend_rank
 */
export function computeTalent(remaining: Player[]): Map<string, number> {
  const rankedPlayers = remaining.filter(p => p.blend_rank !== null && p.blend_rank !== undefined);
  
  if (rankedPlayers.length === 0) {
    return new Map(remaining.map(p => [p.player, 0.5]));
  }
  
  const ranks = rankedPlayers.map(p => p.blend_rank!);
  const normalizedRanks = minmax01(ranks);
  
  const result = new Map<string, number>();
  
  remaining.forEach(player => {
    if (player.blend_rank !== null && player.blend_rank !== undefined) {
      const rankIndex = ranks.indexOf(player.blend_rank);
      const normalizedRank = normalizedRanks[rankIndex] || 0.5;
      // Invert so lower rank = higher talent
      result.set(player.player, 1 - normalizedRank);
    } else {
      result.set(player.player, 0.5); // Default for unranked players
    }
  });
  
  return result;
}

/**
 * Compute positional scarcity around user's next picks
 */
export function computeScarcity(
  remaining: Player[], 
  nextPicks: [number, number]
): Record<string, number> {
  const [w1, w2] = nextPicks;
  const positions = [...new Set(remaining.map(p => p.pos).filter(Boolean))];
  const result: Record<string, number> = {};
  
  positions.forEach(pos => {
    if (!pos) return;
    const posPlayers = remaining.filter(p => p.pos === pos && p.slp_rank !== null && p.slp_rank !== undefined);
    
    // Count players available at each window
    const countW1 = posPlayers.filter(p => p.slp_rank! <= w1).length;
    const countW2 = posPlayers.filter(p => p.slp_rank! <= w2).length;
    
    // Scarcity = 1 / (1 + count) - higher count = lower scarcity
    const scarcity = 1 / (1 + countW1);
    result[pos] = clamp01(scarcity);
  });
  
  // Normalize to [0,1] with max = 1.00
  const maxScarcity = Math.max(...Object.values(result));
  if (maxScarcity > 0) {
    Object.keys(result).forEach(pos => {
      if (pos) {
        result[pos] = result[pos] / maxScarcity;
      }
    });
  }
  
  return result;
}

/**
 * Compute roster needs with FLEX pressure
 */
export function computeNeeds(myRoster: RosterCounts): Record<string, number> {
  const needs: Record<string, number> = {};
  
  // Required minima
  const required = {
    QB: 1,
    TE: 1,
    RB: 2,
    WR: 2,
    FLEX: 2
  };
  
  // Calculate FLEX debt (aim for 6+ RB+WR by end of R8)
  const flexDebt = Math.max(0, 6 - (myRoster.RB + myRoster.WR));
  
  // QB need: 1 if you have 0, else 0 (cap at 1)
  needs.QB = myRoster.QB === 0 ? 1 : 0;
  
  // TE need: 1 if you have 0, else 0 (cap at 1)
  needs.TE = myRoster.TE === 0 ? 1 : 0;
  
  // RB need: 1 if < 2, else flexDebt/4
  needs.RB = myRoster.RB < 2 ? 1 : Math.min(1, flexDebt / 4);
  
  // WR need: 1 if < 2, else flexDebt/4
  needs.WR = myRoster.WR < 2 ? 1 : Math.min(1, flexDebt / 4);
  
  // DEF and K needs (lower priority)
  needs.DEF = myRoster.DEF === 0 ? 0.5 : 0;
  needs.K = myRoster.K === 0 ? 0.5 : 0;
  
  // Normalize to [0,1]
  const maxNeed = Math.max(...Object.values(needs));
  if (maxNeed > 0) {
    Object.keys(needs).forEach(pos => {
      if (pos) {
        needs[pos] = needs[pos] / maxNeed;
      }
    });
  }
  
  return needs;
}

/**
 * Compute availability risk using logistic function
 */
export function computeAvailability(
  remaining: Player[], 
  nextPick: number, 
  s: number = 6
): Map<string, AvailabilityRisk> {
  const result = new Map<string, AvailabilityRisk>();
  
  remaining.forEach(player => {
    if (player.slp_rank === null || player.slp_rank === undefined) {
      result.set(player.player, {
        availProb: 0.5,
        risk: 0.5,
        takeNow: false
      });
      return;
    }
    
    const delta = nextPick - player.slp_rank;
    
    // Logistic function: P(available) = 1 / (1 + exp(-delta/s))
    const availProb = 1 / (1 + Math.exp(-delta / s));
    const risk = 1 - availProb;
    
    // Take now if Sleeper rank <= next pick
    const takeNow = player.slp_rank <= nextPick;
    
    result.set(player.player, {
      availProb: clamp01(availProb),
      risk: clamp01(risk),
      takeNow
    });
  });
  
  return result;
}

/**
 * Compute Player Priority Score (PPS) for all remaining players
 */
export function computePPS(
  remaining: Player[],
  weights: Weights,
  context: {
    marketValue: Map<string, number>;
    tierUrgency: Map<string, number>;
    needs: Record<string, number>;
    scarcity: Record<string, number>;
    availability: Map<string, AvailabilityRisk>;
  }
): PlayerPriorityScore {
  const result: PlayerPriorityScore = {};
  
  remaining.forEach(player => {
    const pos = player.pos || 'UNK';
    
    const marketValue = context.marketValue.get(player.player) || 0.5;
    const tierUrgency = context.tierUrgency.get(player.player) || 0;
    const need = context.needs[pos] || 0;
    const scarcity = context.scarcity[pos] || 0;
    const availability = context.availability.get(player.player);
    const availabilityRisk = availability ? availability.risk : 0.5;
    
    // Calculate PPS using weighted sum
    const pps = 
      weights.w_value * marketValue +
      weights.w_tier * tierUrgency +
      weights.w_need * need +
      weights.w_scar * scarcity +
      weights.w_avail * availabilityRisk;
    
    result[player.player] = clamp01(pps);
  });
  
  return result;
}

/**
 * Compute Positional Value Index (PVI) by aggregating PPS by position
 */
export function computePVI(
  remaining: Player[],
  PPS: PlayerPriorityScore
): PositionalValueIndex {
  const positions = [...new Set(remaining.map(p => p.pos).filter(Boolean))];
  const result: PositionalValueIndex = {};
  
  positions.forEach(pos => {
    if (!pos) return;
    const posPlayers = remaining.filter(p => p.pos === pos);
    
    if (posPlayers.length === 0) {
      result[pos] = 0;
      return;
    }
    
    // Get top-K PPS values for this position (K = min(6, remaining_in_position))
    const k = Math.min(6, posPlayers.length);
    const topKPPS = posPlayers
      .map(p => PPS[p.player] || 0)
      .sort((a, b) => b - a)
      .slice(0, k);
    
    // PVI = mean of top-K PPS
    const pvi = topKPPS.reduce((sum, pps) => sum + pps, 0) / topKPPS.length;
    result[pos] = clamp01(pvi);
  });
  
  // Normalize so max becomes 1.00
  const maxPVI = Math.max(...Object.values(result));
  if (maxPVI > 0) {
    Object.keys(result).forEach(pos => {
      if (pos) {
        result[pos] = result[pos] / maxPVI;
      }
    });
  }
  
  return result;
}

/**
 * Main PVE computation function that orchestrates all calculations
 */
export function computePVE(
  remaining: Player[],
  weights: Weights,
  nextPicks: [number, number],
  myRoster: RosterCounts,
  tierMetrics: { gapToNextTier: number[]; lastInTierFlags: boolean[] },
  tierDropThreshold: number = 8,
  availabilityS: number = 6
): {
  PPS: PlayerPriorityScore;
  PVI: PositionalValueIndex;
  marketValue: Map<string, number>;
  talent: Map<string, number>;
  availability: Map<string, AvailabilityRisk>;
} {
  // Step 1: Compute base metrics
  const marketValue = computeMarketValue(remaining);
  const talent = computeTalent(remaining);
  const scarcity = computeScarcity(remaining, nextPicks);
  const needs = computeNeeds(myRoster);
  const availability = computeAvailability(remaining, nextPicks[0], availabilityS);
  
  // Step 2: Compute tier urgency for each player
  const tierUrgency = new Map<string, number>();
  remaining.forEach(player => {
    const urgency = calculateTierUrgency(player, tierMetrics.gapToNextTier, tierMetrics.lastInTierFlags, tierDropThreshold);
    tierUrgency.set(player.player, urgency);
  });
  
  // Step 3: Compute PPS
  const PPS = computePPS(remaining, weights, {
    marketValue,
    tierUrgency,
    needs,
    scarcity,
    availability
  });
  
  // Step 4: Compute PVI
  const PVI = computePVI(remaining, PPS);
  
  return {
    PPS,
    PVI,
    marketValue,
    talent,
    availability
  };
} 