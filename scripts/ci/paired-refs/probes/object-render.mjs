// Render per file, in the node storage STORAGE names (object when unset):
// node --expose-gc object-render.mjs <tree> <corpus-root> <admitted.json> <passes> <out.json> [path-filter]
// Each pass parses every admitted file (untimed), renders
// each parsed root once, timing that render alone (each render is its tree's
// first, as the paired-refs corpus batch renders), and releases the roots.
// Writes each file's median render ms over the passes, the total, and a hash
// of the renders. Prints READY before the first timed pass, and each timed
// pass's render milliseconds to stderr as `PASS <ms>`.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [tree, root, admitted, passesArg, out, filter] = process.argv.slice(2);
const language = (await import(pathToFileURL(path.join(tree, 'packages/typescript/dist/index.js')).href)).default;
const engine = await language.createEngine({ nodeStorage: process.env.STORAGE ?? 'object' });
const files = JSON.parse(fs.readFileSync(admitted, 'utf8')).files.filter((file) => filter === undefined || file.path.includes(filter));
const sources = files.map((file) => fs.readFileSync(path.join(root, file.path), 'utf8'));
const pass = (timed) => {
  const roots = sources.map((source) => engine.parse(source));
  const texts = [];
  for (const [i, node] of roots.entries()) {
    const start = performance.now();
    const rendered = engine.render(node);
    let text;
    try { text = rendered.toString(); } finally { rendered[Symbol.dispose]?.(); }
    timed?.[i].push(performance.now() - start);
    texts.push(text);
  }
  for (const node of roots) node[Symbol.dispose]?.();
  return texts;
};
const first = pass();
const hash = crypto.createHash('sha256').update(JSON.stringify(first)).digest('hex');
const equal = first.filter((text, i) => text === sources[i]).length;
console.log('READY');
const timed = files.map(() => []);
for (let p = 0; p < Number(passesArg); p++) {
  pass(timed);
  process.stderr.write(`PASS ${timed.reduce((sum, times) => sum + times[p], 0).toFixed(2)}\n`);
}
const median = (values) => [...values].sort((a, b) => a - b)[values.length >> 1];
const rows = files.map((file, i) => ({ path: file.path, bytes: file.bytes, ms: median(timed[i]) }));
fs.writeFileSync(out, JSON.stringify({ hash, equal, files: rows.length, totalMs: rows.reduce((sum, row) => sum + row.ms, 0), rows }) + '\n');
console.log(JSON.stringify({ hash: hash.slice(0, 10), equal, files: rows.length, totalMs: rows.reduce((sum, row) => sum + row.ms, 0) }));
engine.dispose();
