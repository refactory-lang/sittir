import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { PerformanceObserver, constants, performance } from 'node:perf_hooks';
import os from 'node:os';
import { cpuModel } from '../arena-benchmark-cpu.mjs';
import { CASES, ROUNDS, constructionCases, gcBySample, sha } from './construction-cases.mjs';
const [root, phase, out, nodeStorage = 'object'] = process.argv.slice(2);
const rust = (await import(root + '/packages/rust/dist/index.js')).default;
const engine = await rust.createEngine({ nodeStorage });
const { build, rendered, release, warmup, timed } = constructionCases(engine, nodeStorage);
let sink = 0;
const GC_KINDS = { [constants.NODE_PERFORMANCE_GC_MINOR]: 'minor', [constants.NODE_PERFORMANCE_GC_MAJOR]: 'major', [constants.NODE_PERFORMANCE_GC_INCREMENTAL]: 'incremental', [constants.NODE_PERFORMANCE_GC_WEAKCB]: 'weakcb' };
const gcEntries = [];
const gcObserver = new PerformanceObserver((list) => gcEntries.push(...list.getEntries()));
const LIST_ITEMS = 3 * 2 ** 14 + 1;
const listText = Array.from({ length: LIST_ITEMS }, (_, i) => `x${i};\n`).join('');
function parsedListEdit() {
  const root = engine.parse(listText);
  const tail = engine.parse('tail;\n');
  const items = root.statements();
  let start = performance.now();
  const changed = root.$with.statements(...items, tail.statements()[0]);
  const editMs = performance.now() - start;
  start = performance.now();
  const edited = rendered([changed]);
  const renderMs = performance.now() - start;
  assert.equal(edited, `${listText}tail;\n`);
  start = performance.now();
  release([changed]);
  const releaseMs = performance.now() - start;
  release([root, tail]);
  return { items: LIST_ITEMS, editMs, renderMs, releaseMs, renderSha256: sha(edited) };
}
const samples = [];
const longList = [];
let retained;
try {
  const warmupStart = performance.now();
  let warmupBatches = 0;
  do {
    sink += warmup(warmupBatches);
    warmupBatches++;
    await new Promise(setImmediate);
  } while (performance.now() - warmupStart < 2000);
  if (phase === 'timing') {
    gcObserver.observe({ entryTypes: ['gc'] });
    for (let round = 0; round < ROUNDS; round++) {
      for (let j = 0; j < CASES.length; j++) {
        const { sample, text, edited } = timed(CASES[(j + round) % CASES.length]);
        sink += text.length + edited.length;
        samples.push({ round, ...sample, renderSha256: sha(text), editedSha256: sha(edited) });
      }
    }
    for (let round = 0; round < ROUNDS; round++) longList.push(parsedListEdit());
    await new Promise(setImmediate);
    await new Promise(setImmediate);
    gcEntries.push(...gcObserver.takeRecords());
    gcObserver.disconnect();
    gcBySample(samples, gcEntries, (kind) => GC_KINDS[kind] ?? 'other');
    for (const sample of samples) delete sample.windows;
  } else if (phase === 'memory') {
    assert.equal(typeof global.gc, 'function');
    global.gc(); global.gc();
    const baseline = process.memoryUsage();
    retained = Array.from({ length: 4 }, (_, i) => build(8000, Boolean(i % 2)));
    global.gc(); global.gc();
    const after = process.memoryUsage();
    for (const tree of retained) sink += rendered(tree.roots).length;
    samples.push({ retainedBatches: retained.length, retainedFunctionRoots: 32000, baseline, after, delta: Object.fromEntries(Object.keys(after).map(key => [key, after[key] - baseline[key]])) });
  } else throw new Error('unknown phase');
  const builtMemory = engine.diagnostics.builtMemory?.();
  const result = { at: new Date().toISOString(), root, phase, buildProfile: engine.diagnostics.buildProfile, node: process.version, v8: process.versions.v8, cpu: cpuModel(), loadAverage: os.loadavg(), mode: { storage: nodeStorage, construction: nodeStorage === 'arena' ? 'record' : 'object' }, protocol: 'Public Rust function builders and name edits: every function named x (each its own name node, or one shared) and edited to g, or each named x<i> and edited to y<i>, a text no build made before, or each named x and led by the comment // c, which the edit keeps; built roots and edit results released after the timed edit (releaseMs); seven rotated batches after at least two seconds of warmup; no forced GC in timing mode. Separate retained-population process forces GC before and after retaining 32000 function roots. After the seven batches, seven samples of a parsed list of 49153 statements, longer than three arena chunks, edited through $with to hold them and one item of another parse, that edit rendered and released (longList). Hashes and edit/input identity asserted. Each timed sample carries the GCs that started in each of its steps (gc: step, kind, count, ms), observed throughout and read only after every timed step, so the timed loop never yields. Whole-worker memory, not native attribution.', warmupBatches, builtMemory, samples, longList, sink };
  writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ phase, samples: samples.length, sink, builtMemory }));
} finally { retained = undefined; engine.dispose(); }
