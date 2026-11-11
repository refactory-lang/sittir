import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import os from 'node:os';
import { corpusBatch, hash } from './corpus-batch.mjs';
const [root, grammar, out, nodeStorage = 'object'] = process.argv.slice(2);
const language = (await import(root + '/packages/' + grammar + '/dist/index.js')).default;
const engine = await language.createEngine({ nodeStorage });
const entries = JSON.parse(readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'corpus-' + grammar + '.json'), 'utf8'));
const sources = entries.map(entry => entry.source);
let signature;
let sink = 0;
const samples = [];
const samplesMatched = [];
let peakRss = 0;
function batch(record) {
  const { times, roots, renders, editedRenders, wholes } = corpusBatch(engine, sources);
  const current = { rendered: hash(renders), edits: hash(editedRenders), entries: roots.length, editCount: editedRenders.length };
  if (signature === undefined) signature = current;
  else assert.deepEqual(current, signature);
  sink += wholes.length + renders.reduce((sum, text) => sum + text.length, 0) + editedRenders.reduce((sum, text) => sum + text.length, 0);
  peakRss = Math.max(peakRss, process.memoryUsage.rss());
  if (record) record.push(times);
  // An arena parse stays held until its root is released, so the batch releases each root it parsed, untimed.
  for (const node of roots) node[Symbol.dispose]?.();
  for (const node of wholes) node[Symbol.dispose]?.();
}
try {
  const warmupStart = performance.now();
  let warmupBatches = 0;
  do { batch(undefined); warmupBatches++; await new Promise(setImmediate); } while (performance.now() - warmupStart < 2000);
  for (let i = 0; i < 50; i++) { batch(samples); await new Promise(setImmediate); }
  globalThis.gc(); await new Promise((resolve) => setTimeout(resolve, 50)); globalThis.gc(); await new Promise((resolve) => setTimeout(resolve, 50));
  for (let i = 0; i < 50; i++) { batch(samplesMatched); await new Promise(setImmediate); }
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), root, grammar, nodeStorage, buildProfile: engine.diagnostics.buildProfile, node: process.version, v8: process.versions.v8, cpu: os.cpus()[0].model, loadAverage: os.loadavg(), protocol: 'Public parse/render and same-value root edits over the identical complete corpus, each edit result released after the timed edit (releaseMs), then every entry read whole (depth: Infinity, wholeReadMs); at least two seconds of warmup, fifty timed batches; event-loop yield between batches; no forced GC. Then a full GC, a yield for finalizers, a second full GC and fifty more timed batches (samplesMatched), so every version starts that window just after its dead trees are reclaimed. Peak RSS over every batch. Hashes compared across all iterations and versions by runner.', warmupBatches, signature, samples, samplesMatched, peakRssMB: peakRss / 2 ** 20, memory: process.memoryUsage(), sink }, null, 2) + '\n');
  console.log(JSON.stringify({ grammar, signature, samples: samples.length }));
} finally { engine.dispose(); }
