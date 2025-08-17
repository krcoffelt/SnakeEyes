const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

function normalizeName(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function playerKey(name) { return normalizeName(name).replace(/[.'’]/g, '').trim(); }
function parseCsvFile(fp, opts = { header: true }) {
  const text = fs.readFileSync(fp, 'utf-8');
  return Papa.parse(text, { header: opts.header, skipEmptyLines: true }).data;
}
function safeNum(v) { if (v === null || v === undefined || v === '') return null; const n = Number(v); return Number.isNaN(n) ? null : n; }

const base = process.cwd();
const undRows = parseCsvFile(path.join(base, 'public', 'data', 'underdog_adp.csv'));
const slpRows = parseCsvFile(path.join(base, 'public', 'data', 'sleeper_ranks_full_2025.csv'));
let ronText = fs.readFileSync(path.join(base, 'public', 'data', 'Ron_Rankings.csv'), 'utf-8');
ronText = ronText.replace(/^\s*,+\s*\n/, ''); // drop leading empty header if present
const ronRows = Papa.parse(ronText, { header: true, skipEmptyLines: true }).data;

const slpMap = new Map();
slpRows.forEach(r => {
  const name = String(r.Name || r.name || '').trim();
  const adp = safeNum(r['Sleeper ADP'] || r['Sleeper Adp'] || r['SLEEPER ADP']);
  if (name) slpMap.set(playerKey(name), adp);
});

const undOnly = [];
undRows.forEach(r => {
  const name = String(r.Player || '').trim();
  if (!name) return;
  const key = playerKey(name);
  const slp = slpMap.get(key);
  if (slp == null) undOnly.push(name);
});

const ronOnly = [];
ronRows.forEach(r => {
  const name = String(r.Name || r.name || '').trim();
  if (!name) return;
  const key = playerKey(name);
  const slp = slpMap.get(key);
  if (slp == null) ronOnly.push(name);
});

console.log(JSON.stringify({ und_missing_slp: undOnly.sort(), ron_missing_slp: ronOnly.sort() }, null, 2)); 