import Papa from 'papaparse';
import { Player, CSVData } from './types';
import { safeParseNumber, hashData, playerKey } from './util';
import { isRookie2025 } from './rookieData';

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

/** Load Underdog ADP data with flexible header mapping */
export async function loadUnderdog(): Promise<Player[]> {
  const data = await fetchCsv<CSVData>('/data/underdog_adp.csv');
  
  return data.map(row => {
    const player = applyAlias(String(row.Player || row.player || ''));
    const pos = String(row.Pos || row.pos || row.Position || row.position || '');
    const team = String(row.Team || row.team || '');
    const rank = safeParseNumber(row.Rank || row.rank);
    const adp = safeParseNumber(row.ADP || row.adp);
    const und_id = String(row.Id || row.ID || row.id || '');
    
    if (!player) return null;
    
    return {
      player: player.trim(),
      pos: pos.trim() || undefined,
      team: team.trim() || undefined,
      und_rank: rank,
      und_adp: adp,
      und_id: und_id || undefined,
    };
  }).filter(Boolean) as Player[];
}

/** Load Sleeper ranks data */
export async function loadSleeper(): Promise<Player[]> {
  const data = await fetchCsv<CSVData>('/data/sleeper_ranks_full_2025.csv');
  
  return data.map(row => {
    const rank = safeParseNumber(row['Sleeper ADP'] || row['Sleeper ADP'] || row.rank);
    const player = applyAlias(String(row.Name || row.name || row.Player || row.player || ''));
    const pos = String(row.Pos || row.pos || row.Position || row.position || '');
    const team = String(row.Team || row.team || '');
    const bye = safeParseNumber(row.BYE || row.bye);
    
    if (!player) return null;
    
    return {
      player: player.trim(),
      pos: pos.trim() || undefined,
      team: team.trim() || undefined,
      bye: bye,
      slp_rank: rank,
    };
  }).filter(Boolean) as Player[];
}

/** Load Ron rankings data */
export async function loadRon(): Promise<Array<{ ron_id?: string; name: string; ron_rank?: number; ron_pos?: string; ron_pos_rank?: number; ron_tier?: number; ron_target_round_12?: number }>> {
  const data = await fetchCsv<CSVData>('/data/Ron_Rankings.csv');
  const rows = data
    .map(row => {
      const tierRaw = String(row['Value Tiers'] || row['Tier'] || '').trim();
      if (!tierRaw) {
        // skip invalid header/blank rows
        if (!row['Name'] && !row['Rank']) return null;
      }
      const name = String(row['Name'] || row['name'] || '').trim();
      if (!name) return null;
      const rank = safeParseNumber(row['Rank']);
      const pos = String(row['Pos.'] || row['Pos'] || row['Position'] || '').trim();
      const posRank = safeParseNumber(row['Pos Rk'] || row['Pos Rank'] || row['PosRk']);
      const id = String(row['id'] || row['Id'] || row['ID'] || '').trim();
      const targetRound = safeParseNumber(row['Target Round'] || row['TargetRound']);
      const tierNumMatch = tierRaw.match(/tier\s*(\d+)/i);
      const ron_tier = tierNumMatch ? Number(tierNumMatch[1]) : null;
      return {
        ron_id: id || undefined,
        name,
        ron_rank: rank ?? undefined,
        ron_pos: pos || undefined,
        ron_pos_rank: posRank ?? undefined,
        ron_tier: ron_tier ?? undefined,
        ron_target_round_12: targetRound ?? undefined
      };
    })
    .filter(Boolean) as Array<{ ron_id?: string; name: string; ron_rank?: number; ron_pos?: string; ron_pos_rank?: number; ron_tier?: number; ron_target_round_12?: number }>;
  return rows;
}

/** Merge Underdog and Sleeper data by player name and Underdog id, then enrich with Ron fields */
export function mergePlayers(
  underdog: Player[], 
  sleeper: Player[],
  ron: Array<{ ron_id?: string; name: string; ron_rank?: number; ron_pos?: string; ron_pos_rank?: number; ron_tier?: number; ron_target_round_12?: number }>,
  blendConfig: { und: number; slp: number } = { und: 0.6, slp: 0.4 }
): Player[] {
  const sleeperMap = new Map<string, Player>();
  sleeper.forEach(player => {
    const key = playerKey(player.player);
    sleeperMap.set(key, player);
  });

  const ronById = new Map<string, any>();
  const ronByName = new Map<string, any>();
  ron.forEach(r => {
    if (r.ron_id) ronById.set(r.ron_id, r);
    ronByName.set(playerKey(r.name), r);
  });
  
  const merged: Player[] = [];
  const usedSleeper = new Set<string>();

  underdog.forEach(udPlayer => {
    const key = playerKey(udPlayer.player);
    const slp = sleeperMap.get(key);
    const ronRec = (udPlayer.und_id && ronById.get(udPlayer.und_id)) || ronByName.get(key);

    const mergedPlayer: Player = {
      player: udPlayer.player,
      pos: udPlayer.pos || slp?.pos,
      team: udPlayer.team || slp?.team,
      bye: slp?.bye,
      isRookie: isRookie2025(udPlayer.player),
      und_rank: udPlayer.und_rank ?? null,
      und_adp: udPlayer.und_adp ?? null,
      und_id: udPlayer.und_id,
      slp_rank: slp?.slp_rank ?? null,
      ron_rank: ronRec?.ron_rank ?? null,
      ron_pos_rank: ronRec?.ron_pos_rank ?? null,
      ron_tier: ronRec?.ron_tier ?? null,
      ron_target_round_12: ronRec?.ron_target_round_12 ?? null,
      ron_id: ronRec?.ron_id ?? null,
    };

    if (mergedPlayer.und_rank !== null && mergedPlayer.slp_rank !== null) {
      mergedPlayer.value = mergedPlayer.slp_rank - mergedPlayer.und_rank;
      mergedPlayer.blend_rank = blendConfig.und * mergedPlayer.und_rank + blendConfig.slp * mergedPlayer.slp_rank;
    } else if (mergedPlayer.und_rank !== null) {
      mergedPlayer.blend_rank = mergedPlayer.und_rank * 1.2;
    } else if (mergedPlayer.slp_rank !== null) {
      mergedPlayer.blend_rank = mergedPlayer.slp_rank * 1.2;
    } else if (mergedPlayer.ron_rank !== null) {
      // If only Ron rank exists, give a mild penalty but preserve ordering
      mergedPlayer.blend_rank = mergedPlayer.ron_rank * 1.25;
    } else {
      mergedPlayer.blend_rank = null;
    }

    merged.push(mergedPlayer);
    if (slp) usedSleeper.add(key);
  });

  sleeper.forEach(slp => {
    const key = playerKey(slp.player);
    if (!usedSleeper.has(key)) {
      const ronRec = ronByName.get(key);
      const soloPlayer: Player = {
        ...slp,
        ron_rank: ronRec?.ron_rank ?? null,
        ron_pos_rank: ronRec?.ron_pos_rank ?? null,
        ron_tier: ronRec?.ron_tier ?? null,
        ron_target_round_12: ronRec?.ron_target_round_12 ?? null,
        ron_id: ronRec?.ron_id ?? null,
        blend_rank: slp.slp_rank ? slp.slp_rank * 1.2 : (ronRec?.ron_rank ? ronRec.ron_rank * 1.25 : null),
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

export function hashSourceData(underdog: Player[], sleeper: Player[], ron: any[]): string {
  return hashData({ underdog, sleeper, ron });
}

export async function loadAllPlayerData(
  blendConfig: { und: number; slp: number } = { und: 0.6, slp: 0.4 }
): Promise<{ players: Player[]; dataHash: string }> {
  try {
    const [underdog, sleeper, ron] = await Promise.all([
      loadUnderdog(),
      loadSleeper(),
      loadRon()
    ]);
    const players = mergePlayers(underdog, sleeper, ron, blendConfig);
    const dataHash = hashSourceData(underdog, sleeper, ron);
    return { players, dataHash };
  } catch (error) {
    console.error('Failed to load player data:', error);
    throw error;
  }
} 