import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { performance, PerformanceObserver, constants as perfConstants } from 'node:perf_hooks';
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
const samplesMatched = [];
let peakRss = 0;
const gcEntries = [];
new PerformanceObserver((list) => { for (const entry of list.getEntries()) gcEntries.push({ start: entry.startTime, ms: entry.duration, kind: entry.detail?.kind }); }).observe({ entryTypes: ['gc'] });
const windows = {};
const GC_KINDS = { [perfConstants.NODE_PERFORMANCE_GC_MAJOR]: 'major', [perfConstants.NODE_PERFORMANCE_GC_MINOR]: 'minor', [perfConstants.NODE_PERFORMANCE_GC_INCREMENTAL]: 'incremental', [perfConstants.NODE_PERFORMANCE_GC_WEAKCB]: 'weakcb' };
function gcTally(from = -Infinity, to = Infinity) {
  const tally = {};
  for (const entry of gcEntries) {
    if (entry.start < from || entry.start > to) continue;
    const kind = GC_KINDS[entry.kind] ?? String(entry.kind);
    tally[kind] ??= { count: 0, ms: 0 };
    tally[kind].count += 1;
    tally[kind].ms += entry.ms;
  }
  return tally;
}
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
  start = performance.now();
  for (const node of changed) node[Symbol.dispose]?.();
  const releaseMs = performance.now() - start;
  const current = { rendered: hash(renders), edits: hash(editedRenders), entries: roots.length, editCount: changed.length };
  if (signature === undefined) signature = current;
  else assert.deepEqual(current, signature);
  sink += renders.reduce((sum, text) => sum + text.length, 0) + editedRenders.reduce((sum, text) => sum + text.length, 0);
  peakRss = Math.max(peakRss, process.memoryUsage.rss());
  if (record) record.push({ parseMs, renderMs, editMs, releaseMs, pipelineMs: parseMs + renderMs });
}
try {
  const warmupStart = performance.now();
  let warmupBatches = 0;
  do { batch(undefined); warmupBatches++; await new Promise(setImmediate); } while (performance.now() - warmupStart < 2000);
  windows.samples = [performance.now()];
  for (let i = 0; i < 50; i++) { batch(samples); await new Promise(setImmediate); }
  windows.samples.push(performance.now());
  globalThis.gc(); await new Promise((resolve) => setTimeout(resolve, 50)); globalThis.gc(); await new Promise((resolve) => setTimeout(resolve, 50));
  windows.samplesMatched = [performance.now()];
  for (let i = 0; i < 50; i++) { batch(samplesMatched); await new Promise(setImmediate); }
  windows.samplesMatched.push(performance.now());
  await new Promise((resolve) => setTimeout(resolve, 20));
  const gc = { all: gcTally(), samples: gcTally(...windows.samples), samplesMatched: gcTally(...windows.samplesMatched) };
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), root, grammar, nodeStorage, buildProfile: engine.diagnostics.buildProfile, node: process.version, v8: process.versions.v8, cpu: os.cpus()[0].model, loadAverage: os.loadavg(), protocol: 'Public parse/render and same-value root edits over the identical complete corpus, each edit result released after the timed edit (releaseMs); at least two seconds of warmup, fifty timed batches; event-loop yield between batches; no forced GC. Then a full GC, a yield for finalizers, a second full GC and fifty more timed batches (samplesMatched), so every version starts that window just after its dead trees are reclaimed. Peak RSS over every batch. Hashes compared across all iterations and versions by runner. GC events tallied by kind over the process and each timed window (gc).', warmupBatches, signature, samples, samplesMatched, peakRssMB: peakRss / 2 ** 20, gc, memory: process.memoryUsage(), sink }, null, 2) + '\n');
  console.log(JSON.stringify({ grammar, signature, samples: samples.length }));
} finally { engine.dispose(); }
