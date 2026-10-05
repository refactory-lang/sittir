import { readFileSync, readdirSync } from 'node:fs';
const dir = process.argv[2];
const file = readdirSync(dir).find((f) => f.endsWith('.cpuprofile'));
const prof = JSON.parse(readFileSync(`${dir}/${file}`, 'utf8'));
const byId = new Map(prof.nodes.map((n) => [n.id, n]));
const self = new Map();
const dt = prof.timeDeltas;
let total = 0;
prof.samples.forEach((id, i) => {
  const n = byId.get(id);
  const cf = n.callFrame;
  const where = cf.url ? cf.url.replace(/^file:\/\//, '').split('/').slice(-2).join('/') + ':' + (cf.lineNumber + 1) : '';
  const key = `${cf.functionName || '(anonymous)'}  ${where}`;
  self.set(key, (self.get(key) ?? 0) + dt[i]);
  total += dt[i];
});
const rows = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 28);
for (const [key, t] of rows) console.log(`${((t / total) * 100).toFixed(1).padStart(5)}%  ${key}`);
