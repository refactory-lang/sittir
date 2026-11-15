// Usage: node --perf-basic-prof render-profile.mjs <tree> <grammar> <receipt.json> <warmup batches> <batches> <batches per engine>
// The render phase alone, in arena storage, for a native profiler. Each batch
// parses <grammar>'s corpus and renders every parsed root once (corpus-batch.mjs's
// parsePhase and renderPhase: render, toString, dispose), then releases the
// roots. A fresh engine every <batches per engine> batches, since an arena
// parse's records live until their engine is disposed. When PERF_CTL and
// PERF_ACK name perf record's control and ack fifos (perf record --delay=-1
// --control fifo:<ctl>,<ack>), the events are enabled only while a timed batch
// renders. Writes <receipt.json>: the batch counts, each timed render phase's
// milliseconds, the rendered text's hash (the same every batch) and the
// native images the process mapped from <tree>.
import assert from 'node:assert/strict';
import { constants, existsSync, openSync, readFileSync, readSync, writeFileSync, writeSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { cpuModel } from '../../arena-benchmark-cpu.mjs';
import { hash, parsePhase, renderPhase } from '../corpus-batch.mjs';

const [root, grammar, receipt, warmupArg, batchesArg, perEngineArg] = process.argv.slice(2);
const [warmupBatches, batches, batchesPerEngine] = [warmupArg, batchesArg, perEngineArg].map(Number);
const here = path.dirname(new URL(import.meta.url).pathname);
const sources = JSON.parse(readFileSync(path.join(here, '..', `corpus-${grammar}.json`), 'utf8')).map((entry) => entry.source);
const language = (await import(`${root}/packages/${grammar}/dist/index.js`)).default;

const control = process.env.PERF_CTL
  ? { ctl: openSync(process.env.PERF_CTL, constants.O_WRONLY), ack: openSync(process.env.PERF_ACK, constants.O_RDONLY), pending: '' }
  : undefined;
const reply = Buffer.alloc(64);
function perf(command) {
  if (!control) return;
  writeSync(control.ctl, `${command}\n`);
  while (!control.pending.includes('ack\n')) {
    const read = readSync(control.ack, reply, 0, reply.length, null);
    if (read === 0) throw new Error(`perf closed its ack fifo after '${command}'`);
    control.pending += reply.toString('latin1', 0, read);
  }
  control.pending = control.pending.slice(control.pending.indexOf('ack\n') + 4);
}

const mappedImages = () =>
  existsSync('/proc/self/maps')
    ? [...new Set(readFileSync('/proc/self/maps', 'utf8').split('\n').map((line) => line.split(/\s+/).slice(5).join(' ')).filter((file) => file.startsWith(root) && /\.node$|\.so(\.|$)/.test(file)))].sort()
    : [];

let engine;
let rendered;
let mapped;
const renderMs = [];
async function batch(index, timed) {
  if (index % batchesPerEngine === 0) {
    engine?.dispose();
    engine = await language.createEngine({ nodeStorage: 'arena' });
    mapped ??= mappedImages();
  }
  const roots = parsePhase(engine, sources);
  if (timed) perf('enable');
  const start = performance.now();
  const renders = renderPhase(engine, roots);
  const ms = performance.now() - start;
  if (timed) {
    perf('disable');
    renderMs.push(ms);
  }
  const current = hash(renders);
  if (rendered === undefined) rendered = current;
  else assert.equal(current, rendered);
  for (const node of roots) node[Symbol.dispose]?.();
  await new Promise(setImmediate);
}

try {
  for (let i = 0; i < warmupBatches; i++) await batch(i, false);
  for (let i = 0; i < batches; i++) await batch(i, true);
  const sorted = [...renderMs].sort((a, b) => a - b);
  writeFileSync(receipt, JSON.stringify({
    root, grammar, nodeStorage: 'arena', entries: sources.length, warmupBatches, batches, batchesPerEngine,
    buildProfile: engine.diagnostics.buildProfile, node: process.version, cpu: cpuModel(), sampled: control !== undefined,
    rendered, renderMsMedian: sorted[sorted.length >> 1], renderMsTotal: renderMs.reduce((sum, ms) => sum + ms, 0), mapped, renderMs
  }, null, 1) + '\n');
  console.log(JSON.stringify({ grammar, batches, entries: sources.length, renderMsMedian: sorted[sorted.length >> 1], mapped }));
} finally {
  engine?.dispose();
}
