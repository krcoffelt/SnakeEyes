/**
 * Normalize player names for consistent matching
 * - trim whitespace
 * - collapse multiple spaces to single
 * - convert to lowercase
 * - strip diacritics (basic implementation)
 */
export function normalizeName(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
}

/**
 * Canonical key for player-name matching across sources
 * - normalized
 * - remove common punctuation (dots, apostrophes)
 */
export function playerKey(name: string): string {
  const n = normalizeName(name);
  const base = n.replace(/[.'’]/g, '').replace(/\s+/g, ' ').trim();
  // Strip common generational suffixes at end of name
  const suffixes = /\s+(jr|jr\.|sr|sr\.|ii|iii|iv|v)$/i;
  return base.replace(suffixes, '').trim();
}

/**
 * Calculate z-scores, clip to ±clip, then rescale to [0,1]
 */
export function zscoreClip01(x: number[], clip: number = 2): number[] {
  if (x.length === 0) return [];
  
  const mean = x.reduce((sum, val) => sum + val, 0) / x.length;
  const variance = x.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / x.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return x.map(() => 0.5);
  
  const zscores = x.map(val => (val - mean) / stdDev);
  const clipped = zscores.map(z => Math.max(-clip, Math.min(clip, z)));
  
  // Rescale from [-clip, clip] to [0, 1]
  return clipped.map(z => (z + clip) / (2 * clip));
}

/**
 * Rescale array values to [0,1] range
 */
export function minmax01(x: number[]): number[] {
  if (x.length === 0) return [];
  
  const min = Math.min(...x);
  const max = Math.max(...x);
  
  if (max === min) return x.map(() => 0.5);
  
  return x.map(val => (val - min) / (max - min));
}

/**
 * Generate a hash of data for persistence invalidation
 */
export function hashData(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

/**
 * Safely parse numeric values from CSV
 */
export function safeParseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Clamp value to [0,1] range
 */
export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Format round number with decimal for display
 */
export function formatRound(overallPick: number, teams: number): string {
  const round = Math.ceil(overallPick / teams);
  const pickInRound = ((overallPick - 1) % teams) + 1;
  return `${round}.${pickInRound.toString().padStart(2, '0')}`;
} 