// The Rust construction cases the paired construction worker times and the
// worker-shaped phase profile samples: public function builders and name
// edits over 2000 and 8000 roots, each named x (a name node of its own, or one
// shared) and edited to g, or each named x<i> and edited to y<i>, or each named
// x and led by the comment // c, which the edit keeps. One case builds, renders,
// edits, renders the edit, checks both texts and releases the roots and the
// edit, recording each step's window so a GC can be put in the step it ran in.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';

export const CASES = [2000, 8000].flatMap((n) => [
  { n, reuse: false, many: false, commented: false },
  { n, reuse: true, many: false, commented: false },
  { n, reuse: false, many: true, commented: false },
  { n, reuse: false, many: false, commented: true }
]);
export const ROUNDS = 7;
const COMMENT = '// c';
const nameOf = (many, i) => (many ? `x${i}` : 'x');
const editedNameOf = (many, i) => (many ? `y${i}` : 'g');
const textOf = (n, nameAt, commented) => Array.from({ length: n }, (_, i) => `${commented ? `${COMMENT}\n` : ''}fn ${nameAt(i)}() {}`).join('\n');
export const sha = (text) => createHash('sha256').update(text).digest('hex');

/** The cases over `engine`, whose node storage is `nodeStorage`. */
export function constructionCases(engine, nodeStorage) {
  const b = engine.build;
  function build(n, reuse, many = false, commented = false) {
    const name = reuse ? b.identifier('x') : undefined;
    const roots = Array.from({ length: n }, (_, i) => {
      const root = b.functionItem({ name: name ?? b.identifier(nameOf(many, i)), parameters: b.parameters(), body: b.block({ statements: [] }) });
      return commented ? root.$trivia.leading(COMMENT) : root;
    });
    return { roots, name, many };
  }
  function rendered(roots) {
    return roots.map((node) => {
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
  function warmup(batch) {
    const tree = build(128, batch % 4 === 1, batch % 4 === 2, batch % 4 === 3);
    const changed = edit(tree);
    const length = rendered(tree.roots).length + rendered(changed).length;
    release(tree.roots, changed);
    return length;
  }
  /** One case, timed: its sample (each step's milliseconds and window) and its two texts. */
  function timed({ n, reuse, many, commented }) {
    const t0 = performance.now();
    const tree = build(n, reuse, many, commented);
    const t1 = performance.now();
    const text = rendered(tree.roots);
    const t2 = performance.now();
    const changed = edit(tree);
    const t3 = performance.now();
    const edited = rendered(changed);
    if (reuse && nodeStorage === 'object') assert.equal(tree.roots[0].name(), tree.name);
    if (reuse && nodeStorage !== 'object') assert.equal(rendered([tree.roots[0].name()]), rendered([tree.name]));
    assert.equal(rendered(tree.roots), text);
    assert.equal(text, textOf(n, (i) => nameOf(many, i), commented));
    assert.equal(edited, textOf(n, (i) => editedNameOf(many, i), commented));
    const t4 = performance.now();
    release(tree.roots, changed);
    const t5 = performance.now();
    const sample = {
      n, reuse, many, commented,
      buildMs: t1 - t0, renderMs: t2 - t1, editMs: t3 - t2, releaseMs: t5 - t4, pipelineMs: t2 - t0,
      windows: { build: [t0, t1], render: [t1, t2], edit: [t2, t3], checks: [t3, t4], release: [t4, t5] }
    };
    return { sample, text, edited };
  }
  return { build, rendered, release, warmup, timed };
}

/** Each GC `entries` holds, put in the window of `samples` it started in: per sample and step, the count and milliseconds by kind. */
export function gcBySample(samples, entries, kindName) {
  const starts = samples.flatMap((sample, at) => Object.entries(sample.windows).map(([step, [from, to]]) => ({ at, step, from, to })));
  for (const sample of samples) sample.gc = {};
  for (const entry of entries) {
    const window = starts.find(({ from, to }) => entry.startTime >= from && entry.startTime < to);
    if (window === undefined) continue;
    const kind = kindName(entry.detail?.kind);
    const step = (samples[window.at].gc[window.step] ??= {});
    const tally = (step[kind] ??= { n: 0, ms: 0 });
    tally.n += 1;
    tally.ms += entry.duration;
  }
}
