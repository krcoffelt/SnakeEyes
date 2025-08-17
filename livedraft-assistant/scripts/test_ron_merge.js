const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

function normalizeName(s) {
  return String(s).trim().replace(/\s+/g, ' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function playerKey(name) { return normalizeName(name).replace(/[.'’]/g, '').replace(/\s+/g, ' ').trim(); }
function safeNum(v) { if (v===null||v===undefined||v==='') return null; const n=Number(v); return Number.isNaN(n)?null:n; }

function parseCsv(fp) { const text = fs.readFileSync(fp, 'utf-8'); return Papa.parse(text, { header: true, skipEmptyLines: true }).data; }

const base = process.cwd();
const und = parseCsv(path.join(base, 'public', 'data', 'underdog_adp.csv')).map(r => ({
  name: String(r.Player||'').trim(),
  und_id: String(r.Id||r.ID||r.id||'').trim(),
}));
const ron = parseCsv(path.join(base, 'public', 'data', 'Ron_Rankings.csv')).map(r => ({
  name: String(r.Name||'').trim(),
  id: String(r.id||r.Id||r.ID||'').trim(),
  rank: safeNum(r.Rank)
})).filter(r => r.name);

const ronById = new Map();
ron.forEach(r => { if (r.id) ronById.set(r.id, r); });
const ronByName = new Map();
ron.forEach(r => { ronByName.set(playerKey(r.name), r); });

let matchedById = 0, matchedByName = 0;
let examples = [];
und.slice(0,200).forEach(u => {
  const byId = u.und_id && ronById.get(u.und_id);
  const byName = ronByName.get(playerKey(u.name));
  if (byId) { matchedById++; if (examples.length<10) examples.push({type:'id', name:u.name, rank:byId.rank}); }
  else if (byName) { matchedByName++; if (examples.length<10) examples.push({type:'name', name:u.name, rank:byName.rank}); }
});

console.log(JSON.stringify({ totalUnd: und.length, totalRon: ron.length, matchedById, matchedByName, examples }, null, 2)); 