import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import os from 'node:os';
const [root, grammar, out, nodeStorage = 'object'] = process.argv.slice(2);
const language = (await import(root + '/packages/' + grammar + '/dist/index.js')).default;
const engine = await language.createEngine({ nodeStorage });
const entries = JSON.parse(readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'corpus-' + grammar + '.json'), 'utf8'));
const hash = texts => createHash('sha256').update(JSON.stringify(texts)).digest('hex');
let signature;
let sink = 0;
const samples = [];
function batch(record) {
  let start = performance.now();
  const roots = entries.map(entry => engine.parse(entry.source));
  const parseMs = performance.now() - start;
  start = performance.now();
  const renders = roots.map(node => {
    const rendered = engine.render(node);
    try { return rendered.toString(); } finally { rendered[Symbol.dispose]?.(); }
  });
  const renderMs = performance.now() - start;
  start = performance.now();
  const changed = roots.flatMap(node => Object.keys(node.$with ?? {}).sort().flatMap(key => {
    const setter = node.$with[key];
    if (typeof setter !== 'function' || typeof node[key] !== 'function') return [];
    const value = node[key]();
    return [Array.isArray(value) && setter.length === 0 ? setter.call(node.$with, ...value) : setter.call(node.$with, value)];
  }));
  const editMs = performance.now() - start;
  const editedRenders = changed.map(node => node.$render());
  const current = { rendered: hash(renders), edits: hash(editedRenders), entries: roots.length, editCount: changed.length };
  if (signature === undefined) signature = current;
  else assert.deepEqual(current, signature);
  sink += renders.reduce((sum, text) => sum + text.length, 0) + editedRenders.reduce((sum, text) => sum + text.length, 0);
  if (record) samples.push({ parseMs, renderMs, editMs, pipelineMs: parseMs + renderMs });
}
try {
  const warmupStart = performance.now();
  let warmupBatches = 0;
  do { batch(false); warmupBatches++; await new Promise(setImmediate); } while (performance.now() - warmupStart < 2000);
  for (let i = 0; i < 50; i++) { batch(true); await new Promise(setImmediate); }
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), root, grammar, nodeStorage, buildProfile: engine.diagnostics.buildProfile, node: process.version, v8: process.versions.v8, cpu: os.cpus()[0].model, loadAverage: os.loadavg(), protocol: 'Public parse/render and same-value root edits over the identical complete corpus; at least two seconds of warmup, fifty timed batches; event-loop yield between batches; no forced GC. Hashes compared across all iterations and versions by runner.', warmupBatches, signature, samples, memory: process.memoryUsage(), sink }, null, 2) + '\n');
  console.log(JSON.stringify({ grammar, signature, samples: samples.length }));
} finally { engine.dispose(); }
