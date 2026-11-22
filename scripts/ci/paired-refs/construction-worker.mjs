import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import os from 'node:os';
import { cpuModel } from '../arena-benchmark-cpu.mjs';
const [root, phase, out, nodeStorage = 'object'] = process.argv.slice(2);
const rust = (await import(root + '/packages/rust/dist/index.js')).default;
const engine = await rust.createEngine({ nodeStorage });
const b = engine.build;
let sink = 0;
const nameOf = (many, i) => (many ? `x${i}` : 'x');
const editedNameOf = (many, i) => (many ? `y${i}` : 'g');
function build(n, reuse, many = false) {
  const name = reuse ? b.identifier('x') : undefined;
  const roots = Array.from({ length: n }, (_, i) => b.functionItem({ name: name ?? b.identifier(nameOf(many, i)), parameters: b.parameters(), body: b.block({ statements: [] }) }));
  return { roots, name, many };
}
function rendered(roots) {
  return roots.map(node => {
    const result = engine.render(node);
    try { return result.toString(); } finally { result[Symbol.dispose]?.(); }
  }).join('\n');
}
function edit(tree) {
  return tree.roots.map((node, i) => node.$with.name(b.identifier(editedNameOf(tree.many, i))));
}
function release(...lists) {
  for (const list of lists) for (const node of list) node[Symbol.dispose]?.();
}
const sha = text => createHash('sha256').update(text).digest('hex');
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
    const tree = build(128, warmupBatches % 3 === 1, warmupBatches % 3 === 2);
    const changed = edit(tree);
    sink += rendered(tree.roots).length + rendered(changed).length;
    release(tree.roots, changed);
    warmupBatches++;
    await new Promise(setImmediate);
  } while (performance.now() - warmupStart < 2000);
  if (phase === 'timing') {
    const cases = [2000, 8000].flatMap((n) => [{ n, reuse: false, many: false }, { n, reuse: true, many: false }, { n, reuse: false, many: true }]);
    for (let round = 0; round < 7; round++) {
      for (let j = 0; j < cases.length; j++) {
        const { n, reuse, many } = cases[(j + round) % cases.length];
        let start = performance.now();
        const tree = build(n, reuse, many);
        const buildMs = performance.now() - start;
        start = performance.now();
        const text = rendered(tree.roots);
        const renderMs = performance.now() - start;
        start = performance.now();
        const changed = edit(tree);
        const editMs = performance.now() - start;
        const edited = rendered(changed);
        if (reuse && nodeStorage === 'object') assert.equal(tree.roots[0].name(), tree.name);
        if (reuse && nodeStorage !== 'object') assert.equal(rendered([tree.roots[0].name()]), rendered([tree.name]));
        assert.equal(rendered(tree.roots), text);
        assert.equal(text, Array.from({ length: n }, (_, i) => `fn ${nameOf(many, i)}() {}`).join('\n'));
        assert.equal(edited, Array.from({ length: n }, (_, i) => `fn ${editedNameOf(many, i)}() {}`).join('\n'));
        sink += text.length + edited.length;
        start = performance.now();
        release(tree.roots, changed);
        const releaseMs = performance.now() - start;
        samples.push({ round, n, reuse, many, buildMs, renderMs, editMs, releaseMs, pipelineMs: buildMs + renderMs, renderSha256: sha(text), editedSha256: sha(edited) });
      }
    }
    for (let round = 0; round < 7; round++) longList.push(parsedListEdit());
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
  const result = { at: new Date().toISOString(), root, phase, buildProfile: engine.diagnostics.buildProfile, node: process.version, v8: process.versions.v8, cpu: cpuModel(), loadAverage: os.loadavg(), mode: { storage: nodeStorage, construction: nodeStorage === 'arena' ? 'record' : 'object' }, protocol: 'Public Rust function builders and name edits: every function named x (each its own name node, or one shared) and edited to g, or each named x<i> and edited to y<i>, a text no build made before; built roots and edit results released after the timed edit (releaseMs); seven rotated batches after at least two seconds of warmup; no forced GC in timing mode. Separate retained-population process forces GC before and after retaining 32000 function roots. After the seven batches, seven samples of a parsed list of 49153 statements, longer than three arena chunks, edited through $with to hold them and one item of another parse, that edit rendered and released (longList). Hashes and edit/input identity asserted. Whole-worker memory, not native attribution.', warmupBatches, builtMemory, samples, longList, sink };
  writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ phase, samples: samples.length, sink, builtMemory }));
} finally { retained = undefined; engine.dispose(); }
