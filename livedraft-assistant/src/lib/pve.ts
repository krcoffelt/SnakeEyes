import { Player, Weights, RosterCounts, TierMetrics } from './types';

export interface PVEResult {
  PPS: { [playerName: string]: number };
  PVI: { [pos: string]: number };
  rosterNeeds: { [pos: string]: number };
  flexPressure: number;
  scarcityMetrics: { [pos: string]: { count: number; urgency: number } };
  tierUrgency: { [playerName: string]: number };
  availabilityRisk: { [playerName: string]: { risk: number; takeNow: boolean } };
}

export function computePVE(
  remaining: Player[],
  weights: Weights,
  nextPicks: [number, number],
  myRoster: RosterCounts,
  tierMetrics: TierMetrics,
  tierDropThreshold: number,
  availabilityS: number,
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

  // 1. Compute Market Value (z-score of value across remaining)
  const marketValues = computeMarketValue(remaining);
  
  // 2. Compute Talent (inverse of normalized blend_rank)
  const talentScores = computeTalent(remaining);
  
  // 3. Compute Positional Scarcity
  const scarcityMetrics = computeScarcity(remaining, nextPicks, config.teams);
  
  // 4. Compute Roster Needs with FLEX Logic
  const { rosterNeeds, flexPressure } = computeRosterNeeds(myRoster, config);
  
  // 5. Compute Tier Urgency
  const tierUrgency = computeTierUrgency(remaining, tierMetrics, tierDropThreshold);
  
  // 6. Compute Availability Risk
  const availabilityRisk = computeAvailabilityRisk(remaining, nextPicks, availabilityS);
  
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
    config
  );
  
  // 8. Compute Positional Value Index
  const PVI = computePVI(remaining, PPS);
  
  return {
    PPS,
    PVI,
    rosterNeeds,
    flexPressure,
    scarcityMetrics,
    tierUrgency,
    availabilityRisk
  };
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
      const zScore = (player.value - mean) / stdDev;
      const clipped = Math.max(-2, Math.min(2, zScore));
      result[player.player] = (clipped + 2) / 4; // Rescale to [0,1]
    } else {
      result[player.player] = 0.5; // Neutral value for missing data
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

function computeScarcity(
  remaining: Player[], 
  nextPicks: [number, number], 
  teams: number
): { [pos: string]: { count: number; urgency: number } } {
  const positions = ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'];
  const result: { [pos: string]: { count: number; urgency: number } } = {};
  
  positions.forEach(pos => {
    const posPlayers = remaining.filter(p => p.pos === pos);
    const count = posPlayers.length;
    
    // Calculate scarcity based on next two pick windows
    const window1 = Math.min(nextPicks[0], nextPicks[1]);
    const window2 = Math.max(nextPicks[0], nextPicks[1]);
    
    const playersInWindow1 = posPlayers.filter(p => 
      p.slp_rank && p.slp_rank <= window1
    ).length;
    
    const playersInWindow2 = posPlayers.filter(p => 
      p.slp_rank && p.slp_rank <= window2
    ).length;
    
    // Scarcity urgency: fewer players available = higher urgency
    const urgency = Math.max(0, 1 - (playersInWindow1 / Math.max(1, teams)));
    
    result[pos] = { count, urgency };
  });
  
  return result;
}

function computeRosterNeeds(
  myRoster: RosterCounts, 
  config: { flexCount: 1 | 2; ppr: 'PPR' | 'Half PPR' | 'Standard' }
): { rosterNeeds: { [pos: string]: number }; flexPressure: number } {
  const rosterNeeds: { [pos: string]: number } = {};
  
  // Base requirements
  const baseRequirements = {
    QB: 1,
    RB: 2,
    WR: 2,
    TE: 1,
    DEF: 1,
    K: 1
  };
  
  // FLEX requirements based on configuration
  const flexRequirements = {
    RB: config.flexCount === 2 ? 1 : 0, // Extra RB for 2 FLEX
    WR: config.flexCount === 2 ? 1 : 0  // Extra WR for 2 FLEX
  };
  
  // Calculate needs for each position
  Object.entries(baseRequirements).forEach(([pos, required]) => {
    const current = myRoster[pos as keyof RosterCounts] || 0;
    const flexBonus = flexRequirements[pos as keyof typeof flexRequirements] || 0;
    const totalRequired = required + flexBonus;
    
    if (current >= totalRequired) {
      rosterNeeds[pos] = 0; // Position filled
    } else if (current === 0) {
      rosterNeeds[pos] = 1; // Critical need
    } else {
      rosterNeeds[pos] = 0.5; // Partial need
    }
  });
  
  // Special FLEX logic
  const totalRBWR = myRoster.RB + myRoster.WR;
  const flexTarget = 4 + config.flexCount; // 2 RB + 2 WR + FLEX count
  const flexPressure = Math.max(0, flexTarget - totalRBWR) / config.flexCount;
  
  // Adjust RB/WR needs based on FLEX pressure
  if (flexPressure > 0) {
    rosterNeeds.RB = Math.max(rosterNeeds.RB, flexPressure);
    rosterNeeds.WR = Math.max(rosterNeeds.WR, flexPressure);
  }
  
  return { rosterNeeds, flexPressure };
}

function computeTierUrgency(
  remaining: Player[], 
  tierMetrics: TierMetrics, 
  threshold: number
): { [playerName: string]: number } {
  const result: { [playerName: string]: number } = {};
  
  remaining.forEach(player => {
    if (!player.tier) {
      result[player.player] = 0;
      return;
    }
    
    const tierIndex = player.tier - 1;
    const gapToNext = tierMetrics.gapToNextTier[tierIndex];
    const isLastInTier = tierMetrics.lastInTierFlags[tierIndex];
    
    if (isLastInTier && gapToNext >= threshold) {
      // High urgency: last player in tier with big gap
      result[player.player] = 1;
    } else if (isLastInTier && gapToNext >= threshold / 2) {
      // Medium urgency: last player with moderate gap
      result[player.player] = 0.7;
    } else if (isLastInTier) {
      // Low urgency: last player with small gap
      result[player.player] = 0.3;
    } else {
      // No urgency: not last in tier
      result[player.player] = 0;
    }
  });
  
  return result;
}

function computeAvailabilityRisk(
  remaining: Player[], 
  nextPicks: [number, number], 
  s: number
): { [playerName: string]: { risk: number; takeNow: boolean } } {
  const result: { [playerName: string]: { risk: number; takeNow: boolean } } = {};
  
  remaining.forEach(player => {
    if (!player.slp_rank) {
      result[player.player] = { risk: 0.5, takeNow: false };
      return;
    }
    
    const nextPick = Math.min(...nextPicks);
    const delta = nextPick - player.slp_rank;
    
    // Logistic function for availability probability
    const availProb = 1 / (1 + Math.exp(-delta / s));
    const risk = 1 - availProb;
    
    // Mark as "take now" if Sleeper rank is at or before next pick
    const takeNow = player.slp_rank <= nextPick;
    
    result[player.player] = { risk, takeNow };
  });
  
  return result;
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
    if (!pos) {
      result[player.player] = 0;
      return;
    }
    
    // Base PPS calculation
    let pps = 0;
    
    // Market value component
    pps += weights.w_value * (marketValues[player.player] || 0);
    
    // Tier urgency component
    pps += weights.w_tier * (tierUrgency[player.player] || 0);
    
    // Roster need component
    pps += weights.w_need * (rosterNeeds[pos] || 0);
    
    // Scarcity component
    const scarcity = scarcityMetrics[pos];
    if (scarcity) {
      pps += weights.w_scar * scarcity.urgency;
    }
    
    // Availability risk component
    const availability = availabilityRisk[player.player];
    if (availability) {
      pps += weights.w_avail * availability.risk;
    }
    
    // PPR adjustments
    if (config.ppr === 'PPR') {
      if (pos === 'WR' || pos === 'TE') {
        pps *= 1.1; // Boost WR/TE in PPR
      }
    } else if (config.ppr === 'Half PPR') {
      if (pos === 'WR' || pos === 'TE') {
        pps *= 1.05; // Moderate boost in Half PPR
      }
    }
    
    // FLEX position adjustments
    if (pos === 'RB' || pos === 'WR') {
      // RB/WR get bonus for FLEX eligibility
      pps *= 1.05;
    }
    
    // Rookie bonus
    if (player.isRookie) {
      pps *= 1.08; // 8% boost for rookies (upside potential)
    }
    
    // Clamp to [0,1]
    result[player.player] = Math.max(0, Math.min(1, pps));
  });
  
  return result;
}

function computePVI(remaining: Player[], PPS: { [playerName: string]: number }): { [pos: string]: number } {
  const positions = ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'];
  const result: { [pos: string]: number } = {};
  
  positions.forEach(pos => {
    const posPlayers = remaining.filter(p => p.pos === pos);
    if (posPlayers.length === 0) {
      result[pos] = 0;
      return;
    }
    
    // Get top K PPS scores for this position
    const k = Math.min(6, posPlayers.length);
    const topPPS = posPlayers
      .map(p => PPS[p.player] || 0)
      .sort((a, b) => b - a)
      .slice(0, k);
    
    // Calculate mean PPS for position
    const meanPPS = topPPS.reduce((sum, pps) => sum + pps, 0) / k;
    result[pos] = meanPPS;
  });
  
  // Normalize so max PVI = 1.00
  const maxPVI = Math.max(...Object.values(result));
  if (maxPVI > 0) {
    Object.keys(result).forEach(pos => {
      result[pos] = result[pos] / maxPVI;
    });
  }
  
  return result;
} 