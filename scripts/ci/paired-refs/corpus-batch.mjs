// One timed pass of the corpus phases over every source: parse, render, a
// same-value edit of each root's settable members (each edit result released
// after the timed edit, releaseMs), then a whole-tree read (depth: Infinity).
// The roots, renders, edit renders and whole trees stay live until the caller
// drops the result. The parse, render and edit phases are exported on their own,
// so a probe of one phase runs the code this pass times. The edit phase pushes
// each edit's entry index and member key into `labels` when it is given, in the
// same walk that decides which members it edits.
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';

export const hash = (texts) => createHash('sha256').update(JSON.stringify(texts)).digest('hex');

export const parsePhase = (engine, sources) => sources.map((source) => engine.parse(source));

export const renderPhase = (engine, roots) => roots.map((node) => {
  const rendered = engine.render(node);
  try { return rendered.toString(); } finally { rendered[Symbol.dispose]?.(); }
});

export const editPhase = (roots, labels) => roots.flatMap((node, entry) => Object.keys(node.$with ?? {}).sort().flatMap((key) => {
  const setter = node.$with[key];
  if (typeof setter !== 'function' || typeof node[key] !== 'function') return [];
  labels?.push({ entry, key });
  const value = node[key]();
  return [Array.isArray(value) && setter.length === 0 ? setter.call(node.$with, ...value) : setter.call(node.$with, value)];
}));

export function corpusBatch(engine, sources) {
  let start = performance.now();
  const roots = parsePhase(engine, sources);
  const parseMs = performance.now() - start;
  start = performance.now();
  const renders = renderPhase(engine, roots);
  const renderMs = performance.now() - start;
  const editLabels = [];
  start = performance.now();
  const changed = editPhase(roots, editLabels);
  const editMs = performance.now() - start;
  const editedRenders = changed.map((node) => node.$render());
  start = performance.now();
  for (const node of changed) node[Symbol.dispose]?.();
  const releaseMs = performance.now() - start;
  start = performance.now();
  const wholes = sources.map((source) => engine.parse(source, { depth: Infinity }));
  const wholeReadMs = performance.now() - start;
  return { times: { parseMs, renderMs, editMs, releaseMs, wholeReadMs, pipelineMs: parseMs + renderMs }, roots, renders, editedRenders, editLabels, wholes };
}
