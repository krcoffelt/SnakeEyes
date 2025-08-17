const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

function normalizeName(s) {
  return String(s)
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
function playerKey(name) {
  const n = normalizeName(name);
  return n.replace(/[.'’]/g, '').replace(/\s+/g, ' ').trim();
}
const NAME_ALIASES = {
  'tj hockenson': 'tj hockenson',
  "t.j. hockenson": 'tj hockenson',
  'dk metcalf': 'dk metcalf',
  "d.k. metcalf": 'dk metcalf',
  'san francisco 49ers d/st': '49ers d/st',
  '49ers dst': '49ers d/st',
};
function applyAlias(name) {
  const key = playerKey(name);
  return NAME_ALIASES[key] || name;
}
function safeNum(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const res = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (res.errors && res.errors.length) {
    console.warn('CSV parse warnings for', filePath, res.errors.slice(0, 2));
  }
  return res.data;
}

function loadUnderdog(baseDir) {
  const rows = parseCsv(path.join(baseDir, 'public', 'data', 'underdog_adp.csv'));
  return rows.map(row => {
    const player = applyAlias(row.Player || row.player || '');
    const pos = (row.Pos || row.pos || row.Position || row.position || '').trim();
    const team = (row.Team || row.team || '').trim();
    const rank = safeNum(row.Rank || row.rank);
    const adp = safeNum(row.ADP || row.adp);
    if (!player) return null;
    return { player: String(player).trim(), pos: pos || undefined, team: team || undefined, und_rank: rank, und_adp: adp };
  }).filter(Boolean);
}

function loadSleeper(baseDir) {
  const rows = parseCsv(path.join(baseDir, 'public', 'data', 'sleeper_ranks_full_2025.csv'));
  return rows.map(row => {
    const player = applyAlias(row.Name || row.name || row.Player || row.player || '');
    const pos = (row.Pos || row.pos || row.Position || row.position || '').trim();
    const team = (row.Team || row.team || '').trim();
    const bye = safeNum(row.BYE || row.bye);
    const rank = safeNum(row['Sleeper ADP'] || row['Sleeper Adp'] || row['SLEEPER ADP'] || row.rank);
    if (!player) return null;
    return { player: String(player).trim(), pos: pos || undefined, team: team || undefined, bye, slp_rank: rank };
  }).filter(Boolean);
}

function mergePlayers(und, slp, blend = { und: 0.6, slp: 0.4 }) {
  const slpMap = new Map();
  slp.forEach(p => slpMap.set(playerKey(p.player), p));
  const used = new Set();
  const out = [];
  und.forEach(u => {
    const key = playerKey(u.player);
    const s = slpMap.get(key);
    if (s) {
      const m = {
        player: u.player,
        pos: u.pos || s.pos,
        team: u.team || s.team,
        bye: s.bye,
        und_rank: u.und_rank,
        und_adp: u.und_adp,
        slp_rank: s.slp_rank,
      };
      if (m.und_rank != null && m.slp_rank != null) {
        m.value = m.slp_rank - m.und_rank;
        m.blend_rank = blend.und * m.und_rank + blend.slp * m.slp_rank;
      } else if (m.und_rank != null) {
        m.blend_rank = m.und_rank * 1.2;
      } else if (m.slp_rank != null) {
        m.blend_rank = m.slp_rank * 1.2;
      } else {
        m.blend_rank = null;
      }
      out.push(m);
      used.add(key);
    } else {
      out.push({ ...u, blend_rank: u.und_rank != null ? u.und_rank * 1.2 : null });
    }
  });
  slp.forEach(s => {
    const key = playerKey(s.player);
    if (!used.has(key)) out.push({ ...s, blend_rank: s.slp_rank != null ? s.slp_rank * 1.2 : null });
  });
  out.sort((a, b) => (a.blend_rank == null ? 1 : b.blend_rank == null ? -1 : a.blend_rank - b.blend_rank));
  return out;
}

function kMeans1D(values, k, maxIterations = 100) {
  if (!values.length || k <= 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  let centroids = Array.from({ length: k }, (_, i) => min + (i + 0.5) * (max - min) / k);
  let assignments = [];
  let it = 0;
  while (it < maxIterations) {
    assignments = values.map(v => {
      let dMin = Infinity, best = 0;
      centroids.forEach((c, i) => { const d = Math.abs(v - c); if (d < dMin) { dMin = d; best = i; } });
      return best;
    });
    const newC = Array.from({ length: k }, (_, i) => {
      const cluster = values.filter((_, idx) => assignments[idx] === i);
      return cluster.length ? cluster.reduce((s, v) => s + v, 0) / cluster.length : centroids[i];
    });
    const converged = centroids.every((c, i) => Math.abs(c - newC[i]) < 1e-3);
    centroids = newC;
    if (converged) break;
    it++;
  }
  return assignments;
}

function silhouette1D(values, assignments) {
  if (!values.length || !assignments.length) return 0;
  const clusters = [...new Set(assignments)];
  if (clusters.length <= 1) return 0;
  let total = 0;
  for (let i = 0; i < values.length; i++) {
    const c = assignments[i], v = values[i];
    const same = values.filter((_, idx) => assignments[idx] === c && idx !== i);
    const a = same.length ? same.reduce((s, x) => s + Math.abs(x - v), 0) / same.length : 0;
    let minB = Infinity;
    clusters.forEach(cc => {
      if (cc === c) return;
      const others = values.filter((_, idx) => assignments[idx] === cc);
      if (others.length) {
        const b = others.reduce((s, x) => s + Math.abs(x - v), 0) / others.length;
        if (b < minB) minB = b;
      }
    });
    if (minB === Infinity) minB = 0;
    const s = same.length ? (minB - a) / Math.max(a, minB) : 0;
    total += s;
  }
  return total / values.length;
}

function findFirstTier3RB(baseDir) {
  const und = loadUnderdog(baseDir);
  const slp = loadSleeper(baseDir);
  const merged = mergePlayers(und, slp, { und: 0.6, slp: 0.4 });
  const rbs = merged.filter(p => p.pos === 'RB' && p.blend_rank != null);
  if (rbs.length < 5) {
    return { message: 'Not enough RBs to tier', count: rbs.length };
  }
  const values = rbs.map(p => p.blend_rank);
  let bestK = 5, bestSil = -1;
  const maxK = Math.min(7, Math.floor(rbs.length / 3));
  for (let k = 4; k <= maxK; k++) {
    const a = kMeans1D(values, k);
    const sil = silhouette1D(values, a);
    if (sil > bestSil) { bestSil = sil; bestK = k; }
  }
  const assignments = kMeans1D(values, bestK);
  // Build pairs of player and tier (tier = cluster + 1)
  const withTier = rbs.map((p, i) => ({ ...p, _tier: assignments[i] + 1 }));
  // earliest Tier 3 by blend_rank
  withTier.sort((a, b) => a.blend_rank - b.blend_rank);
  const firstTier3 = withTier.find(p => p._tier === 3);
  if (!firstTier3) {
    return { message: `No Tier 3 found for RB with k=${bestK}`, k: bestK };
  }
  const idx = withTier.findIndex(p => p === firstTier3);
  // Determine where tier 3 starts among RBs
  return {
    k: bestK,
    player: firstTier3.player,
    team: firstTier3.team || null,
    und_rank: firstTier3.und_rank,
    slp_rank: firstTier3.slp_rank,
    blend_rank: firstTier3.blend_rank,
    positionIndex: idx + 1, // 1-based index among RBs by blend_rank
  };
}

if (require.main === module) {
  const baseDir = process.cwd();
  const res = findFirstTier3RB(baseDir);
  console.log(JSON.stringify(res, null, 2));
} 