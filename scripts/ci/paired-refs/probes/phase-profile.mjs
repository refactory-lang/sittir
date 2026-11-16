// Usage: node [--perf-basic-prof] phase-profile.mjs <tree> <grammar> <render|edit> <receipt.json> <warmup batches> <batches> <batches per engine>
// One corpus phase alone, in arena storage (STORAGE=object for object storage), for a profiler. Each batch parses
// <grammar>'s corpus (corpus-batch.mjs's parsePhase), runs the phase over every
// parsed root (renderPhase: render, toString, dispose; or editPhase, after an
// untimed renderPhase as in corpusBatch: a same-value edit of each root's
// settable members, each result rendered and released after the timed
// phase, as corpusBatch does), then releases the
// roots. A fresh engine every <batches per engine> batches, since an arena
// parse's records live until their engine is disposed. A profiler samples only
// while a timed batch runs the phase: when PERF_CTL and PERF_ACK name perf
// record's control and ack fifos (perf record --delay=-1 --control
// fifo:<ctl>,<ack>), its events are enabled; when ALLOC_COUNT names the
// allocation counter (alloc-count.c, preloaded into this process), it counts,
// and its table goes to ALLOC_COUNT_OUT with each return address resolved;
// when V8_HEAP_PROFILE names a file, the inspector's sampling heap profiler
// (V8_HEAP_INTERVAL bytes between samples, objects later collected kept) is
// started, and the windows' samples are summed there by allocating function
// and script, those whose stack passes through the phase's own function
// (renderPhase or editPhase) apart from the rest, which are this driver's;
// when JS_PROFILE names a file, the
// inspector's Profiler (JS_PROFILE_INTERVAL_US between samples) is started,
// and the windows' profiles are merged into one there, their timelines
// concatenated, less the samples taken inside the profiler's own start and
// stop. Writes <receipt.json>: the batch counts, each timed phase's
// milliseconds, the phase's text's hash (the same every batch), the native
// images the process mapped from <tree> and, for the inspector, the samples
// kept and dropped.
import assert from 'node:assert/strict';
import { constants, existsSync, openSync, readFileSync, readSync, writeFileSync, writeSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Session } from 'node:inspector/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { cpuModel } from '../../arena-benchmark-cpu.mjs';
import { editPhase, hash, parsePhase, renderPhase } from '../corpus-batch.mjs';

const [root, grammar, phase, receipt, warmupArg, batchesArg, perEngineArg] = process.argv.slice(2);
const storage = process.env.STORAGE ?? 'arena';
assert.ok(['arena', 'object'].includes(storage), `STORAGE ${storage} is not arena or object`);
const [warmupBatches, batches, batchesPerEngine] = [warmupArg, batchesArg, perEngineArg].map(Number);
const here = path.dirname(new URL(import.meta.url).pathname);
const sources = JSON.parse(readFileSync(path.join(here, '..', `corpus-${grammar}.json`), 'utf8')).map((entry) => entry.source);
const language = (await import(`${root}/packages/${grammar}/dist/index.js`)).default;

let engine;
const phases = {
  render: { fn: renderPhase, before() {}, run: (roots) => renderPhase(engine, roots), texts: (renders) => renders, release() {} },
  edit: { fn: editPhase, before: (roots) => renderPhase(engine, roots), run: editPhase, texts: (changed) => changed.map((node) => node.$render()), release: (changed) => { for (const node of changed) node[Symbol.dispose]?.(); } }
};
const timed = phases[phase];
assert.ok(timed, `phase ${phase} is not one of ${Object.keys(phases).join(', ')}`);

function perfWindow() {
  const ctl = openSync(process.env.PERF_CTL, constants.O_WRONLY);
  const ack = openSync(process.env.PERF_ACK, constants.O_RDONLY);
  const reply = Buffer.alloc(64);
  let pending = '';
  const send = (command) => {
    writeSync(ctl, `${command}\n`);
    while (!pending.includes('ack\n')) {
      const read = readSync(ack, reply, 0, reply.length, null);
      if (read === 0) throw new Error(`perf closed its ack fifo after '${command}'`);
      pending += reply.toString('latin1', 0, read);
    }
    pending = pending.slice(pending.indexOf('ack\n') + 4);
  };
  return { open: () => send('enable'), close: () => send('disable'), finish() {} };
}

async function inspectorWindow(file) {
  const session = new Session();
  session.connect();
  await session.post('Profiler.enable');
  await session.post('Profiler.setSamplingInterval', { interval: Number(process.env.JS_PROFILE_INTERVAL_US) });
  const merged = { nodes: [], startTime: undefined, endTime: 0, samples: [], timeDeltas: [] };
  const childOf = new Map();
  const frameOf = ({ functionName, url, lineNumber, columnNumber }) => `${functionName}\0${url}\0${lineNumber}\0${columnNumber}`;
  const mergedNode = (parent, callFrame) => {
    const key = `${parent?.id}\0${frameOf(callFrame)}`;
    let node = childOf.get(key);
    if (!node) {
      node = { id: merged.nodes.length + 1, callFrame, hitCount: 0, children: [] };
      merged.nodes.push(node);
      parent?.children.push(node.id);
      childOf.set(key, node);
    }
    return node;
  };
  let controlSamples = 0;
  const control = ({ url, functionName }) => url === import.meta.url && (functionName === openWindow.name || functionName === closeWindow.name);
  const add = (profile) => {
    const byId = new Map(profile.nodes.map((node) => [node.id, node]));
    const children = new Set(profile.nodes.flatMap((node) => node.children ?? []));
    const roots = profile.nodes.filter((node) => !children.has(node.id));
    assert.equal(roots.length, 1, 'a window profile has one root');
    const into = new Map();
    const pending = [[roots[0], undefined]];
    while (pending.length) {
      const [node, parent] = pending.pop();
      if (control(node.callFrame)) continue;
      const target = mergedNode(parent, node.callFrame);
      target.hitCount += node.hitCount ?? 0;
      into.set(node.id, target.id);
      for (const child of node.children ?? []) pending.push([byId.get(child), target]);
    }
    merged.startTime ??= profile.startTime;
    for (const [index, sample] of (profile.samples ?? []).entries()) {
      if (!into.has(sample)) {
        controlSamples++;
        continue;
      }
      merged.samples.push(into.get(sample));
      merged.timeDeltas.push(profile.timeDeltas[index]);
    }
  };
  async function openWindow() {
    await session.post('Profiler.start');
  }
  async function closeWindow() {
    add((await session.post('Profiler.stop')).profile);
  }
  return {
    open: openWindow,
    close: closeWindow,
    finish() {
      session.disconnect();
      merged.startTime ??= 0;
      merged.endTime = merged.startTime + merged.timeDeltas.reduce((sum, delta) => sum + delta, 0);
      writeFileSync(file, JSON.stringify(merged));
      return { file, samples: merged.samples.length, controlSamples };
    }
  };
}

function allocWindow(library, file) {
  const counter = createRequire(import.meta.url)(library);
  counter.take();
  return {
    open: () => counter.start(),
    close: () => counter.stop(),
    finish() {
      const taken = counter.take();
      const ips = [...new Set(taken.stacks.flatMap((stack) => stack.ips))];
      writeFileSync(file, JSON.stringify({ ...taken, frames: Object.fromEntries(counter.resolve(ips).map((frame, index) => [ips[index], frame])) }));
      return { file, stacks: taken.stacks.length, dropped: taken.dropped };
    }
  };
}

async function heapWindow(file, interval, phaseFrame) {
  const session = new Session();
  session.connect();
  await session.post('HeapProfiler.enable');
  const functions = new Map();
  let windows = 0;
  const add = ({ head, samples }) => {
    const nodes = new Map();
    const pending = [[head, false]];
    while (pending.length) {
      const [node, below] = pending.pop();
      const inPhase = below || (node.callFrame.functionName === phaseFrame.functionName && node.callFrame.url === phaseFrame.url);
      nodes.set(node.id, { callFrame: node.callFrame, inPhase });
      for (const child of node.children) pending.push([child, inPhase]);
    }
    for (const { nodeId, size } of samples) {
      const { callFrame: { functionName, url }, inPhase } = nodes.get(nodeId) ?? { callFrame: { functionName: '(a node the profile no longer holds)', url: '' }, inPhase: false };
      const key = `${inPhase}\0${functionName}\0${url}`;
      const entry = functions.get(key) ?? { functionName, url, inPhase, bytes: 0, samples: 0 };
      entry.bytes += size;
      entry.samples += 1;
      functions.set(key, entry);
    }
  };
  return {
    open: () => session.post('HeapProfiler.startSampling', { samplingInterval: interval, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true }),
    async close() {
      add((await session.post('HeapProfiler.stopSampling')).profile);
      windows += 1;
    },
    finish() {
      session.disconnect();
      writeFileSync(file, JSON.stringify({ interval, windows, phase: phaseFrame.functionName, functions: [...functions.values()] }));
      return { file, interval, windows, functions: functions.size };
    }
  };
}

const sampler = process.env.PERF_CTL
  ? perfWindow()
  : process.env.ALLOC_COUNT
    ? allocWindow(process.env.ALLOC_COUNT, process.env.ALLOC_COUNT_OUT)
    : process.env.V8_HEAP_PROFILE
      ? await heapWindow(process.env.V8_HEAP_PROFILE, Number(process.env.V8_HEAP_INTERVAL), { functionName: timed.fn.name, url: new URL('../corpus-batch.mjs', import.meta.url).href })
      : process.env.JS_PROFILE
        ? await inspectorWindow(process.env.JS_PROFILE)
        : undefined;

const mappedImages = () =>
  existsSync('/proc/self/maps')
    ? [...new Set(readFileSync('/proc/self/maps', 'utf8').split('\n').map((line) => line.split(/\s+/).slice(5).join(' ')).filter((file) => file.startsWith(root) && /\.node$|\.so(\.|$)/.test(file)))].sort()
    : [];

let texts;
let mapped;
const phaseMs = [];
async function batch(index, sampled) {
  if (index % batchesPerEngine === 0) {
    engine?.dispose();
    engine = await language.createEngine({ nodeStorage: storage });
    mapped ??= mappedImages();
  }
  const roots = parsePhase(engine, sources);
  timed.before(roots);
  if (sampled) await sampler?.open();
  const start = performance.now();
  const result = timed.run(roots);
  const ms = performance.now() - start;
  if (sampled) {
    await sampler?.close();
    phaseMs.push(ms);
  }
  const current = hash(timed.texts(result));
  if (texts === undefined) texts = current;
  else assert.equal(current, texts);
  timed.release(result);
  for (const node of roots) node[Symbol.dispose]?.();
  await new Promise(setImmediate);
}

try {
  for (let i = 0; i < warmupBatches; i++) await batch(i, false);
  for (let i = 0; i < batches; i++) await batch(i, true);
  const sampling = sampler?.finish();
  const sorted = [...phaseMs].sort((a, b) => a - b);
  writeFileSync(receipt, JSON.stringify({
    root, grammar, phase, nodeStorage: storage, entries: sources.length, warmupBatches, batches, batchesPerEngine,
    buildProfile: engine.diagnostics.buildProfile, node: process.version, cpu: cpuModel(), sampled: sampler !== undefined, sampling,
    texts, phaseMsMedian: sorted[sorted.length >> 1], phaseMsTotal: phaseMs.reduce((sum, ms) => sum + ms, 0), mapped, phaseMs
  }, null, 1) + '\n');
  console.log(JSON.stringify({ grammar, phase, batches, entries: sources.length, phaseMsMedian: sorted[sorted.length >> 1], mapped }));
} finally {
  engine?.dispose();
}
