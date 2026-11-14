// Usage: node --expose-gc reference-worker.mjs <tree> <admitted.json> <out.json> <tool> <batches>
// One fresh process timing one tool over every admitted file of one corpus:
// <tool> is object or arena (sittir's corpus phases, corpus-batch.mjs, in that
// node storage), deep-read (the arena whole read's native call alone, on the
// addon: per file one parseRecords, which parses and reads the tree whole and
// keeps no tree, with the bytes the engine's arena holds after each chunk's
// reads, builtMemory's count, and the tree's visible nodes, backerParity's
// count, both taken outside the timed call) or oxfmt
// (format() in process, one file at a time, each call awaited before the next
// starts, so one file is formatted at a time). sittir runs the corpus in
// path-order chunks of about CHUNK_BYTES of source; after each chunk every
// parse root and whole tree is released ([Symbol.dispose], timed as
// treeReleaseMs; deep-read reads each chunk on an engine of its own and
// disposes it, timed as releaseMs), the chunk's trees are dropped and an
// event-loop yield is taken before the next. Each phase's time is its sum
// over the chunks, so a batch never holds the whole corpus's trees. At least
// two seconds and one batch of warmup, then <batches> timed batches with an
// event-loop yield between them and no forced GC. Every batch's output hashes
// must equal the first's.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import os from 'node:os';
import { cpuModel } from '../../arena-benchmark-cpu.mjs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { corpusBatch, hash } from '../corpus-batch.mjs';
import { loadCorpus, loadNative, loadOxfmt, loadSittir } from './corpus.mjs';

const CHUNK_BYTES = 2e6;
const [tree, admitted, out, tool, batchesArg] = process.argv.slice(2);
const batches = Number(batchesArg);
assert(Number.isInteger(batches) && batches > 0, `batches: ${batchesArg}`);
const { manifest, paths, sources, bytes } = loadCorpus(path.resolve(admitted));
const chunks = [[]];
let chunkBytes = 0;
for (const [i, file] of manifest.files.entries()) {
  if (chunkBytes >= CHUNK_BYTES) { chunks.push([]); chunkBytes = 0; }
  chunks.at(-1).push(sources[i]);
  chunkBytes += file.bytes;
}
let run;
let describe;
let dispose = () => {};
if (tool === 'oxfmt') {
  const { format, version } = await loadOxfmt(path.resolve(tree));
  describe = { tool, version };
  run = async () => {
    const codes = [];
    const start = performance.now();
    for (let i = 0; i < sources.length; i++) codes.push((await format(paths[i], sources[i], {})).code);
    const formatMs = performance.now() - start;
    return { times: { formatMs }, signature: { formatted: hash(codes), entries: codes.length } };
  };
} else if (tool === 'deep-read') {
  const native = loadNative(path.resolve(tree));
  native.externalBuffers();
  const withEngine = (use) => {
    const engine = new native.SittirEngine();
    try { return use(engine); } finally { engine.dispose(); }
  };
  describe = { tool, buildProfile: withEngine((engine) => engine.buildProfile) };
  const visibleNodes = chunks.reduce((n, chunk) => n + withEngine((engine) => chunk.reduce((m, source) => m + native.backerParity(engine.handle, source).nodes, 0)), 0);
  run = async () => {
    const times = { wholeReadMs: 0, releaseMs: 0 };
    const roots = [];
    let readBytes = 0;
    for (const chunk of chunks) {
      const engine = new native.SittirEngine();
      for (const source of chunk) {
        const start = performance.now();
        const read = native.parseRecords(engine.handle, source);
        times.wholeReadMs += performance.now() - start;
        const { root } = JSON.parse(read);
        assert(root !== null, 'a root with a record');
        roots.push(root);
      }
      readBytes += native.builtMemory(engine.handle).chunks;
      const start = performance.now();
      engine.dispose();
      times.releaseMs += performance.now() - start;
      await new Promise(setImmediate);
    }
    return { times, signature: { roots: hash(roots), entries: roots.length, visibleNodes, readBytes, chunks: chunks.length } };
  };
} else {
  assert(tool === 'object' || tool === 'arena', `tool: ${tool}`);
  const engine = await loadSittir(path.resolve(tree), tool);
  describe = { tool: 'sittir', nodeStorage: tool, buildProfile: engine.diagnostics.buildProfile };
  dispose = () => engine.dispose();
  run = async () => {
    const times = {};
    const renders = [];
    const editedRenders = [];
    for (const chunk of chunks) {
      const pass = corpusBatch(engine, chunk);
      const start = performance.now();
      for (const node of pass.roots) node[Symbol.dispose]?.();
      for (const node of pass.wholes) node[Symbol.dispose]?.();
      pass.times.treeReleaseMs = performance.now() - start;
      for (const [phase, ms] of Object.entries(pass.times)) times[phase] = (times[phase] ?? 0) + ms;
      renders.push(...pass.renders);
      editedRenders.push(...pass.editedRenders);
      await new Promise(setImmediate);
    }
    return { times, signature: { rendered: hash(renders), edits: hash(editedRenders), entries: renders.length, editCount: editedRenders.length, chunks: chunks.length }, renders };
  };
}
let signature;
let rendersDifferingFromSource;
let peakRss = 0;
const samples = [];
const batch = async (record) => {
  const { times, signature: current, renders } = await run();
  if (signature === undefined) {
    signature = current;
    if (renders) rendersDifferingFromSource = renders.filter((text, i) => text !== sources[i]).length;
  } else assert.deepEqual(current, signature);
  peakRss = Math.max(peakRss, process.memoryUsage.rss());
  if (record) samples.push(times);
  await new Promise(setImmediate);
};
try {
  const warmupStart = performance.now();
  let warmupBatches = 0;
  do { await batch(false); warmupBatches++; } while (performance.now() - warmupStart < 2000);
  for (let i = 0; i < batches; i++) await batch(true);
  writeFileSync(out, JSON.stringify({
    at: new Date().toISOString(), tree, ...describe, corpus: manifest.name, commit: manifest.commit, files: sources.length, bytes,
    node: process.version, v8: process.versions.v8, cpu: cpuModel(), loadAverage: os.loadavg(),
    protocol: `Every admitted file of one corpus per batch (sittir in path-order chunks of about ${CHUNK_BYTES / 1e6} MB, each phase summed over the chunks, every parse root and whole tree released after its chunk (treeReleaseMs), a yield between chunks; deep-read the addon's parseRecords per file, each chunk on an engine of its own, disposed after it (releaseMs); oxfmt one awaited format() per file); at least two seconds and one batch of warmup, then the timed batches, an event-loop yield between batches, no forced GC; output hashes equal across batches.`,
    warmupBatches, signature, rendersDifferingFromSource, samples, peakRssMB: peakRss / 2 ** 20,
  }, null, 1) + '\n');
  console.log(JSON.stringify({ tool, corpus: manifest.name, signature, samples: samples.length }));
} finally {
  dispose();
}
