import { Player, TierMetrics } from './types';
import { minmax01 } from './util';

/**
 * Simple 1D k-means clustering for tier building
 */
export function kMeans1D(values: number[], k: number, maxIterations: number = 100): number[] {
  if (values.length === 0 || k <= 0) return [];
  
  // Initialize centroids evenly across the range
  const min = Math.min(...values);
  const max = Math.max(...values);
  const centroids = Array.from({ length: k }, (_, i) => min + (i + 0.5) * (max - min) / k);
  
  let assignments: number[] = [];
  let iterations = 0;
  
  while (iterations < maxIterations) {
    // Assign each value to nearest centroid
    assignments = values.map(value => {
      let minDistance = Infinity;
      let bestCentroid = 0;
      
      centroids.forEach((centroid, i) => {
        const distance = Math.abs(value - centroid);
        if (distance < minDistance) {
          minDistance = distance;
          bestCentroid = i;
        }
      });
      
      return bestCentroid;
    });
    
    // Update centroids
    const newCentroids = Array.from({ length: k }, (_, i) => {
      const clusterValues = values.filter((_, index) => assignments[index] === i);
      return clusterValues.length > 0 ? clusterValues.reduce((sum, val) => sum + val, 0) / clusterValues.length : centroids[i];
    });
    
    // Check convergence
    const converged = centroids.every((centroid, i) => Math.abs(centroid - newCentroids[i]) < 0.001);
    if (converged) break;
    
    centroids.splice(0, centroids.length, ...newCentroids);
    iterations++;
  }
  
  return assignments;
}

/**
 * Calculate silhouette score for 1D clustering
 */
export function silhouette1D(values: number[], assignments: number[]): number {
  if (values.length === 0 || assignments.length === 0) return 0;
  
  const uniqueClusters = [...new Set(assignments)];
  if (uniqueClusters.length <= 1) return 0;
  
  let totalSilhouette = 0;
  
  for (let i = 0; i < values.length; i++) {
    const currentCluster = assignments[i];
    const currentValue = values[i];
    
    // Calculate intra-cluster distance (a)
    const sameClusterValues = values.filter((_, index) => assignments[index] === currentCluster && index !== i);
    const a = sameClusterValues.length > 0 
      ? sameClusterValues.reduce((sum, val) => sum + Math.abs(val - currentValue), 0) / sameClusterValues.length
      : 0;
    
    // Calculate nearest inter-cluster distance (b)
    let minB = Infinity;
    uniqueClusters.forEach(cluster => {
      if (cluster !== currentCluster) {
        const otherClusterValues = values.filter((_, index) => assignments[index] === cluster);
        if (otherClusterValues.length > 0) {
          const avgDistance = otherClusterValues.reduce((sum, val) => sum + Math.abs(val - currentValue), 0) / otherClusterValues.length;
          minB = Math.min(minB, avgDistance);
        }
      }
    });
    
    if (minB === Infinity) minB = 0;
    
    // Calculate silhouette for this point
    const silhouette = sameClusterValues.length > 0 ? (minB - a) / Math.max(a, minB) : 0;
    totalSilhouette += silhouette;
  }
  
  return totalSilhouette / values.length;
}

/**
 * Build tiers for players using Ron tiers when present, else k-means/quantiles
 */
export function buildTiers(players: Player[], byPosition: boolean = true): Player[] {
  if (players.length === 0) return players;
  
  if (byPosition) {
    // Group by position and build tiers for each
    const positions = [...new Set(players.map(p => p.pos).filter(Boolean))];
    const result: Player[] = [];
    
    positions.forEach(pos => {
      const posPlayers = players.filter(p => p.pos === pos);
      const withRon = posPlayers.filter(p => p.ron_tier != null);
      const withoutRon = posPlayers.filter(p => p.ron_tier == null && p.blend_rank !== null);

      // Prefer Ron-provided tiers when available
      withRon.forEach(p => {
        result.push({ ...p, tier: p.ron_tier! });
      });

      if (withoutRon.length >= 12) {
        // Use k-means with silhouette score optimization
        const values = withoutRon.map(p => p.blend_rank!);
        let bestK = 5;
        let bestSilhouette = -1;
        
        for (let k = 4; k <= Math.min(7, Math.floor(withoutRon.length / 3)); k++) {
          const assignments = kMeans1D(values, k);
          const silhouette = silhouette1D(values, assignments);
          
          if (silhouette > bestSilhouette) {
            bestSilhouette = silhouette;
            bestK = k;
          }
        }
        
        const assignments = kMeans1D(values, bestK);
        withoutRon.forEach((player, index) => {
          result.push({ ...player, tier: assignments[index] + 1 });
        });
      } else if (withoutRon.length >= 5) {
        // Fallback to equal-depth quantiles
        const sorted = [...withoutRon].sort((a, b) => a.blend_rank! - b.blend_rank!);
        const tierSize = Math.ceil(sorted.length / 5);
        
        sorted.forEach((player, index) => {
          result.push({ ...player, tier: Math.floor(index / tierSize) + 1 });
        });
      } else {
        // Too few players, assign tier 1 for those without Ron tiers
        withoutRon.forEach(player => {
          result.push({ ...player, tier: 1 });
        });
      }
    });
    
    // Add players without blend_rank (tier null), if any left
    const noRankPlayers = players.filter(p => p.blend_rank === null && p.ron_tier == null);
    result.push(...noRankPlayers);
    
    return result;
  } else {
    // Global tiers across all positions (kept for completeness; rarely used)
    const rankedPlayers = players.filter(p => p.blend_rank !== null && p.ron_tier == null);
    if (rankedPlayers.length >= 12) {
      const values = rankedPlayers.map(p => p.blend_rank!);
      const assignments = kMeans1D(values, 5);
      
      rankedPlayers.forEach((player, index) => {
        (player as Player & { tier: number }).tier = assignments[index] + 1;
      });
    }
    
    // Ensure Ron tiers are applied if present
    const withRon = players.filter(p => p.ron_tier != null);
    withRon.forEach(p => { (p as Player & { tier: number }).tier = p.ron_tier!; });
    
    return players;
  }
}

/**
 * Compute tier drop-off metrics for urgency calculations
 */
export function tierDropOffMetrics(playersByPos: { [pos: string]: Player[] }): TierMetrics {
  const gapToNextTier: number[] = [];
  const lastInTierFlags: boolean[] = [];
  
  Object.entries(playersByPos).forEach(([pos, players]) => {
    if (players.length === 0) return;
    
    const rankedPlayers = players.filter(p => p.blend_rank !== null && p.tier !== null);
    if (rankedPlayers.length === 0) return;
    
    // Sort by blend_rank within position
    rankedPlayers.sort((a, b) => a.blend_rank! - b.blend_rank!);
    
    // Group by tier
    const tierGroups = new Map<number, Player[]>();
    rankedPlayers.forEach(player => {
      const tier = player.tier!;
      if (!tierGroups.has(tier)) {
        tierGroups.set(tier, []);
      }
      tierGroups.get(tier)!.push(player);
    });
    
    // Calculate gaps and identify last players in tiers
    const tiers = Array.from(tierGroups.keys()).sort((a, b) => a - b);
    
    tiers.forEach((tier, index) => {
      const tierPlayers = tierGroups.get(tier)!;
      const lastPlayer = tierPlayers[tierPlayers.length - 1];
      
      if (index < tiers.length - 1) {
        // Not the last tier
        const nextTier = tiers[index + 1];
        const nextTierPlayers = tierGroups.get(nextTier)!;
        const firstNextTierPlayer = nextTierPlayers[0];
        
        const gap = firstNextTierPlayer.blend_rank! - lastPlayer.blend_rank!;
        gapToNextTier.push(gap);
        
        // Mark as last in tier if gap is significant
        lastInTierFlags.push(gap >= 8); // Default threshold
      } else {
        // Last tier
        gapToNextTier.push(0);
        lastInTierFlags.push(false);
      }
    });
  });
  
  return { gapToNextTier, lastInTierFlags };
}

/**
 * Calculate tier urgency for a player based on drop-off risk
 */
export function calculateTierUrgency(
  player: Player, 
  gapToNextTier: number[], 
  lastInTierFlags: boolean[], 
  dropThreshold: number = 8
): number {
  if (player.tier === null || player.blend_rank === null) return 0;
  
  // Find the gap for this player's tier
  const tierIndex = player.tier - 1;
  if (tierIndex >= gapToNextTier.length) return 0;
  
  const gap = gapToNextTier[tierIndex];
  const isLastInTier = lastInTierFlags[tierIndex];
  
  if (gap >= dropThreshold && isLastInTier) {
    return 1.0; // High urgency
  } else if (gap >= dropThreshold * 0.5) {
    return 0.5; // Medium urgency
  } else {
    return 0.1; // Low urgency
  }
} 