// Usage: node whole-read.mjs <tree> <grammar> <storage> <batches> <out.json>
// Reads every entry of the grammar's corpus whole (depth: Infinity): a quarter
// of <batches> as warmup, then <batches> timed. Writes each timed batch's
// milliseconds.
import { readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
const [root, grammar, nodeStorage, batches, out] = process.argv.slice(2);
const language = (await import(root + '/packages/' + grammar + '/dist/index.js')).default;
const engine = await language.createEngine({ nodeStorage });
const entries = JSON.parse(readFileSync(new URL('../corpus-' + grammar + '.json', import.meta.url), 'utf8'));
const read = () => entries.map((entry) => engine.parse(entry.source, { depth: Infinity })).length;
let sink = 0;
for (let i = 0; i < Math.ceil(Number(batches) / 4); i++) sink += read();
const ms = [];
for (let i = 0; i < Number(batches); i++) {
  const start = performance.now();
  sink += read();
  ms.push(performance.now() - start);
}
const sorted = [...ms].sort((a, b) => a - b);
writeFileSync(out, JSON.stringify({ grammar, nodeStorage, buildProfile: engine.diagnostics.buildProfile, batches: ms.length, medianMs: sorted[sorted.length >> 1], ms, sink }) + '\n');
engine.dispose();
