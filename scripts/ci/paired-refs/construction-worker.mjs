import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import os from 'node:os';
const [root, phase, out, nodeStorage = 'object'] = process.argv.slice(2);
const rust = (await import(root + '/packages/rust/dist/index.js')).default;
const engine = await rust.createEngine({ nodeStorage });
const b = engine.build;
let sink = 0;
function build(n, reuse) {
  const name = reuse ? b.identifier('x') : undefined;
  const roots = Array.from({ length: n }, () => b.functionItem({ name: name ?? b.identifier('x'), parameters: b.parameters(), body: b.block({ statements: [] }) }));
  return { roots, name };
}
function rendered(roots) {
  return roots.map(node => {
    const result = engine.render(node);
    try { return result.toString(); } finally { result[Symbol.dispose]?.(); }
  }).join('\n');
}
function edit(tree) {
  return tree.roots.map(node => node.$with.name(b.identifier('g')));
}
const sha = text => createHash('sha256').update(text).digest('hex');
const samples = [];
let retained;
try {
  const warmupStart = performance.now();
  let warmupBatches = 0;
  do {
    const tree = build(128, Boolean(warmupBatches % 2));
    sink += rendered(tree.roots).length + rendered(edit(tree)).length;
    warmupBatches++;
    await new Promise(setImmediate);
  } while (performance.now() - warmupStart < 2000);
  if (phase === 'timing') {
    const cases = [{ n: 2000, reuse: false }, { n: 2000, reuse: true }, { n: 8000, reuse: false }, { n: 8000, reuse: true }];
    for (let round = 0; round < 7; round++) {
      for (let j = 0; j < cases.length; j++) {
        const { n, reuse } = cases[(j + round) % cases.length];
        let start = performance.now();
        const tree = build(n, reuse);
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
        assert.equal(text, Array(n).fill('fn x() {}').join('\n'));
        assert.equal(edited, Array(n).fill('fn g() {}').join('\n'));
        sink += text.length + edited.length;
        samples.push({ round, n, reuse, buildMs, renderMs, editMs, pipelineMs: buildMs + renderMs, renderSha256: sha(text), editedSha256: sha(edited) });
      }
    }
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
  const result = { at: new Date().toISOString(), root, phase, buildProfile: engine.diagnostics.buildProfile, node: process.version, v8: process.versions.v8, cpu: os.cpus()[0].model, loadAverage: os.loadavg(), mode: { storage: nodeStorage, construction: nodeStorage === 'arena' ? 'record' : 'object' }, protocol: 'Public Rust function builders and name edits; seven rotated batches after at least two seconds of warmup; no forced GC in timing mode. Separate retained-population process forces GC before and after retaining 32000 function roots. Hashes and edit/input identity asserted. Whole-worker memory, not native attribution.', warmupBatches, builtMemory, samples, sink };
  writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ phase, samples: samples.length, sink, builtMemory }));
} finally { retained = undefined; engine.dispose(); }
