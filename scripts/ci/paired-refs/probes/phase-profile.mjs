// Usage: node [--perf-basic-prof] phase-profile.mjs <tree> <grammar> <render|edit> <receipt.json> <warmup batches> <batches> <batches per engine>
// One corpus phase alone, in arena storage, for a profiler. Each batch parses
// <grammar>'s corpus (corpus-batch.mjs's parsePhase), runs the phase over every
// parsed root (renderPhase: render, toString, dispose; or editPhase: a
// same-value edit of each root's settable members, each result rendered and
// released after the timed phase, as corpusBatch does), then releases the
// roots. A fresh engine every <batches per engine> batches, since an arena
// parse's records live until their engine is disposed. A profiler samples only
// while a timed batch runs the phase: when PERF_CTL and PERF_ACK name perf
// record's control and ack fifos (perf record --delay=-1 --control
// fifo:<ctl>,<ack>), its events are enabled; when JS_PROFILE names a file, the
// inspector's Profiler (JS_PROFILE_INTERVAL_US between samples) is started,
// and the windows' profiles are merged into one there, their timelines
// concatenated, less the samples taken inside the profiler's own start and
// stop. Writes <receipt.json>: the batch counts, each timed phase's
// milliseconds, the phase's text's hash (the same every batch), the native
// images the process mapped from <tree> and, for the inspector, the samples
// kept and dropped.
import assert from 'node:assert/strict';
import { constants, existsSync, openSync, readFileSync, readSync, writeFileSync, writeSync } from 'node:fs';
import { Session } from 'node:inspector/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { cpuModel } from '../../arena-benchmark-cpu.mjs';
import { editPhase, hash, parsePhase, renderPhase } from '../corpus-batch.mjs';

const [root, grammar, phase, receipt, warmupArg, batchesArg, perEngineArg] = process.argv.slice(2);
const [warmupBatches, batches, batchesPerEngine] = [warmupArg, batchesArg, perEngineArg].map(Number);
const here = path.dirname(new URL(import.meta.url).pathname);
const sources = JSON.parse(readFileSync(path.join(here, '..', `corpus-${grammar}.json`), 'utf8')).map((entry) => entry.source);
const language = (await import(`${root}/packages/${grammar}/dist/index.js`)).default;

let engine;
const phases = {
  render: { run: (roots) => renderPhase(engine, roots), texts: (renders) => renders, release() {} },
  edit: { run: editPhase, texts: (changed) => changed.map((node) => node.$render()), release: (changed) => { for (const node of changed) node[Symbol.dispose]?.(); } }
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

const sampler = process.env.PERF_CTL ? perfWindow() : process.env.JS_PROFILE ? await inspectorWindow(process.env.JS_PROFILE) : undefined;

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
    engine = await language.createEngine({ nodeStorage: 'arena' });
    mapped ??= mappedImages();
  }
  const roots = parsePhase(engine, sources);
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
    root, grammar, phase, nodeStorage: 'arena', entries: sources.length, warmupBatches, batches, batchesPerEngine,
    buildProfile: engine.diagnostics.buildProfile, node: process.version, cpu: cpuModel(), sampled: sampler !== undefined, sampling,
    texts, phaseMsMedian: sorted[sorted.length >> 1], phaseMsTotal: phaseMs.reduce((sum, ms) => sum + ms, 0), mapped, phaseMs
  }, null, 1) + '\n');
  console.log(JSON.stringify({ grammar, phase, batches, entries: sources.length, phaseMsMedian: sorted[sorted.length >> 1], mapped }));
} finally {
  engine?.dispose();
}
