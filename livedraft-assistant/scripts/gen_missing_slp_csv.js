const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

function normalizeName(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function playerKey(name) { return normalizeName(name).replace(/[.'’]/g, '').trim(); }
function parseCsv(text, header = true) { return Papa.parse(text, { header, skipEmptyLines: true }).data; }
function read(fp) { return fs.readFileSync(fp, 'utf-8'); }
function safeNum(v) { if (v === null || v === undefined || v === '') return null; const n = Number(v); return Number.isNaN(n) ? null : n; }

const base = process.cwd();
const undPath = path.join(base, 'public', 'data', 'underdog_adp.csv');
const slpPath = path.join(base, 'public', 'data', 'sleeper_ranks_full_2025.csv');
const ronPath = path.join(base, 'public', 'data', 'Ron_Rankings.csv');

const undRows = parseCsv(read(undPath));
const slpRows = parseCsv(read(slpPath));
const ronRows = parseCsv(read(ronPath));

const slpMap = new Map();
slpRows.forEach(r => {
  const name = String(r.Name || r.name || '').trim();
  const adp = safeNum(r['Sleeper ADP'] || r['Sleeper Adp'] || r['SLEEPER ADP']);
  if (name) slpMap.set(playerKey(name), adp);
});

const outRows = [];
const seen = new Set();
function addRow({ source, name, id, team, pos }) {
  const key = playerKey(name);
  if (seen.has(key)) return;
  const slp = slpMap.get(key);
  if (slp == null) {
    outRows.push({ Source: source, Name: name, Id: id || '', Team: team || '', Pos: pos || '', Sleeper_ADP: '' });
    seen.add(key);
  }
}

// From Underdog
undRows.forEach(r => {
  const name = String(r.Player || '').trim();
  if (!name) return;
  addRow({ source: 'Underdog', name, id: String(r.Id || r.ID || r.id || ''), team: String(r.Team || ''), pos: String(r.Pos || r.Position || '') });
});

// From Ron
ronRows.forEach(r => {
  const name = String(r.Name || r.name || '').trim();
  if (!name) return;
  addRow({ source: 'Ron', name, id: String(r.id || r.Id || r.ID || ''), team: '', pos: String(r['Pos.'] || r.Pos || '') });
});

const csvText = Papa.unparse(outRows, { columns: ['Source', 'Name', 'Id', 'Team', 'Pos', 'Sleeper_ADP'] });
const outPath = path.join(base, 'public', 'data', 'missing_sleeper_adp.csv');
fs.writeFileSync(outPath, csvText);
console.log(`Wrote ${outRows.length} rows to ${outPath}`); 