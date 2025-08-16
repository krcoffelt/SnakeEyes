import Papa from 'papaparse';
import { Player, CSVData } from './types';
import { normalizeName, safeParseNumber, hashData } from './util';
import { isRookie2025, getRookieInfo } from './rookieData';

/**
 * Fetch and parse CSV data using PapaParse
 */
export async function fetchCsv<T>(path: string): Promise<T[]> {
  try {
    const response = await fetch(path);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          resolve(results.data as T[]);
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        }
      });
    });
  } catch (error) {
    throw new Error(`Failed to fetch CSV: ${error}`);
  }
}

/**
 * Load Underdog ADP data with flexible header mapping
 */
export async function loadUnderdog(): Promise<Player[]> {
  const data = await fetchCsv<CSVData>('/data/underdog_adp.csv');
  
  return data.map(row => {
    // Flexible header mapping for your actual CSV format
    const player = String(row.Player || row.player || '');
    const pos = String(row.Pos || row.pos || row.Position || row.position || '');
    const team = String(row.Team || row.team || '');
    const rank = safeParseNumber(row.Rank || row.rank);
    const adp = safeParseNumber(row.ADP || row.adp);
    
    if (!player) return null;
    
    return {
      player: player.trim(),
      pos: pos.trim() || undefined,
      team: team.trim() || undefined,
      und_rank: rank,
      und_adp: adp,
    };
  }).filter(Boolean) as Player[];
}

/**
 * Load Sleeper ranks data
 */
export async function loadSleeper(): Promise<Player[]> {
  const data = await fetchCsv<CSVData>('/data/sleeper_ranks_full_2025.csv');
  
  return data.map(row => {
    const rank = safeParseNumber(row['Sleeper ADP'] || row['Sleeper ADP'] || row.rank);
    const player = String(row.Name || row.name || row.Player || row.player || '');
    const pos = String(row.Pos || row.pos || row.Position || row.position || '');
    const team = String(row.Team || row.team || '');
    const bye = safeParseNumber(row.BYE || row.bye);
    
    if (!player || rank === null) return null;
    
    return {
      player: player.trim(),
      pos: pos.trim() || undefined,
      team: team.trim() || undefined,
      bye: bye,
      slp_rank: rank,
    };
  }).filter(Boolean) as Player[];
}

/**
 * Merge Underdog and Sleeper data by player name
 */
export function mergePlayers(
  underdog: Player[], 
  sleeper: Player[], 
  blendConfig: { und: number; slp: number } = { und: 0.6, slp: 0.4 }
): Player[] {
  const sleeperMap = new Map<string, Player>();
  
  // Create normalized map of Sleeper data
  sleeper.forEach(player => {
    const normalizedName = normalizeName(player.player);
    sleeperMap.set(normalizedName, player);
  });
  
  const merged: Player[] = [];
  const usedSleeperNames = new Set<string>();
  
  // Process Underdog data first
  underdog.forEach(udPlayer => {
    const normalizedName = normalizeName(udPlayer.player);
    const sleeperPlayer = sleeperMap.get(normalizedName);
    
    if (sleeperPlayer) {
      // Merge both sources
      const mergedPlayer: Player = {
        player: udPlayer.player, // Prefer Underdog casing
        pos: udPlayer.pos || sleeperPlayer.pos,
        team: udPlayer.team || sleeperPlayer.team,
        bye: sleeperPlayer.bye, // BYE week from Sleeper
        isRookie: isRookie2025(udPlayer.player), // Check rookie status
        und_rank: udPlayer.und_rank,
        und_adp: udPlayer.und_adp,
        slp_rank: sleeperPlayer.slp_rank,
      };
      
      // Calculate derived fields
      if (mergedPlayer.und_rank !== null && mergedPlayer.slp_rank !== null) {
        mergedPlayer.value = mergedPlayer.slp_rank - mergedPlayer.und_rank;
        mergedPlayer.blend_rank = blendConfig.und * mergedPlayer.und_rank + 
                                  blendConfig.slp * mergedPlayer.slp_rank;
      } else if (mergedPlayer.und_rank !== null) {
        // Only Underdog rank available
        mergedPlayer.blend_rank = mergedPlayer.und_rank * 1.2; // Penalty for missing Sleeper
      } else if (mergedPlayer.slp_rank !== null) {
        // Only Sleeper rank available
        mergedPlayer.blend_rank = mergedPlayer.slp_rank * 1.2; // Penalty for missing Underdog
      }
      
      merged.push(mergedPlayer);
      usedSleeperNames.add(normalizedName);
    } else {
      // Only Underdog data available
      const soloPlayer: Player = {
        ...udPlayer,
        blend_rank: udPlayer.und_rank ? udPlayer.und_rank * 1.2 : null,
      };
      merged.push(soloPlayer);
    }
  });
  
  // Add remaining Sleeper-only players
  sleeper.forEach(slpPlayer => {
    const normalizedName = normalizeName(slpPlayer.player);
    if (!usedSleeperNames.has(normalizedName)) {
      const soloPlayer: Player = {
        ...slpPlayer,
        blend_rank: slpPlayer.slp_rank ? slpPlayer.slp_rank * 1.2 : null,
      };
      merged.push(soloPlayer);
    }
  });
  
  // Sort by blend_rank (nulls last)
  return merged.sort((a, b) => {
    if (a.blend_rank === null && b.blend_rank === null) return 0;
    if (a.blend_rank === null) return 1;
    if (b.blend_rank === null) return -1;
    return a.blend_rank - b.blend_rank;
  });
}

/**
 * Generate hash of source data for persistence invalidation
 */
export function hashSourceData(underdog: Player[], sleeper: Player[]): string {
  return hashData({ underdog, sleeper });
}

/**
 * Load and merge all player data
 */
export async function loadAllPlayerData(
  blendConfig: { und: number; slp: number } = { und: 0.6, slp: 0.4 }
): Promise<{ players: Player[]; dataHash: string }> {
  try {
    const [underdog, sleeper] = await Promise.all([
      loadUnderdog(),
      loadSleeper()
    ]);
    
    const players = mergePlayers(underdog, sleeper, blendConfig);
    const dataHash = hashSourceData(underdog, sleeper);
    
    return { players, dataHash };
  } catch (error) {
    console.error('Failed to load player data:', error);
    throw error;
  }
} 