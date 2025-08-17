import Papa from 'papaparse';
import { Player, CSVData } from './types';
import { normalizeName, safeParseNumber, hashData, playerKey } from './util';
import { isRookie2025, getRookieInfo } from './rookieData';

// Known aliases to normalize source naming quirks
const NAME_ALIASES: Record<string, string> = {
  "tj hockenson": "tj hockenson",
  "t.j. hockenson": "tj hockenson",
  "dk metcalf": "dk metcalf",
  "d.k. metcalf": "dk metcalf",
  "san francisco 49ers d/st": "49ers d/st",
  "49ers dst": "49ers d/st",
};

function applyAlias(name: string): string {
  const key = playerKey(name);
  return NAME_ALIASES[key] ?? name;
}

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
    const player = applyAlias(String(row.Player || row.player || ''));
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
    const player = applyAlias(String(row.Name || row.name || row.Player || row.player || ''));
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
  sleeper.forEach(player => {
    const key = playerKey(player.player);
    sleeperMap.set(key, player);
  });
  
  const merged: Player[] = [];
  const usedSleeper = new Set<string>();
  
  underdog.forEach(udPlayer => {
    const key = playerKey(udPlayer.player);
    const slp = sleeperMap.get(key);
    if (slp) {
      const mergedPlayer: Player = {
        player: udPlayer.player,
        pos: udPlayer.pos || slp.pos,
        team: udPlayer.team || slp.team,
        bye: slp.bye,
        isRookie: isRookie2025(udPlayer.player),
        und_rank: udPlayer.und_rank,
        und_adp: udPlayer.und_adp,
        slp_rank: slp.slp_rank,
      };
      if (mergedPlayer.und_rank !== null && mergedPlayer.slp_rank !== null) {
        mergedPlayer.value = mergedPlayer.slp_rank - mergedPlayer.und_rank;
        mergedPlayer.blend_rank = blendConfig.und * mergedPlayer.und_rank + blendConfig.slp * mergedPlayer.slp_rank;
      } else if (mergedPlayer.und_rank !== null) {
        mergedPlayer.blend_rank = mergedPlayer.und_rank * 1.2;
      } else if (mergedPlayer.slp_rank !== null) {
        mergedPlayer.blend_rank = mergedPlayer.slp_rank * 1.2;
      }
      merged.push(mergedPlayer);
      usedSleeper.add(key);
    } else {
      const soloPlayer: Player = {
        ...udPlayer,
        blend_rank: udPlayer.und_rank ? udPlayer.und_rank * 1.2 : null,
      };
      merged.push(soloPlayer);
    }
  });
  
  sleeper.forEach(slp => {
    const key = playerKey(slp.player);
    if (!usedSleeper.has(key)) {
      const soloPlayer: Player = {
        ...slp,
        blend_rank: slp.slp_rank ? slp.slp_rank * 1.2 : null,
      };
      merged.push(soloPlayer);
    }
  });
  
  return merged.sort((a, b) => {
    if (a.blend_rank === null && b.blend_rank === null) return 0;
    if (a.blend_rank === null) return 1;
    if (b.blend_rank === null) return -1;
    return a.blend_rank - b.blend_rank;
  });
}

export function hashSourceData(underdog: Player[], sleeper: Player[]): string {
  return hashData({ underdog, sleeper });
}

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