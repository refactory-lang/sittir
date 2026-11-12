// One timed pass of the corpus phases over every source: parse, render, a
// same-value edit of each root's settable members (each edit result released
// after the timed edit, releaseMs), then a whole-tree read (depth: Infinity).
// The roots, renders, edit renders and whole trees stay live until the caller
// drops the result. `afterParse`, when given, runs untimed right after the
// timed parse.
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';

export const hash = (texts) => createHash('sha256').update(JSON.stringify(texts)).digest('hex');

export function corpusBatch(engine, sources, afterParse) {
  let start = performance.now();
  const roots = sources.map((source) => engine.parse(source));
  const parseMs = performance.now() - start;
  afterParse?.();
  start = performance.now();
  const renders = roots.map((node) => {
    const rendered = engine.render(node);
    try { return rendered.toString(); } finally { rendered[Symbol.dispose]?.(); }
  });
  const renderMs = performance.now() - start;
  start = performance.now();
  const changed = roots.flatMap((node) => Object.keys(node.$with ?? {}).sort().flatMap((key) => {
    const setter = node.$with[key];
    if (typeof setter !== 'function' || typeof node[key] !== 'function') return [];
    const value = node[key]();
    return [Array.isArray(value) && setter.length === 0 ? setter.call(node.$with, ...value) : setter.call(node.$with, value)];
  }));
  const editMs = performance.now() - start;
  const editedRenders = changed.map((node) => node.$render());
  start = performance.now();
  for (const node of changed) node[Symbol.dispose]?.();
  const releaseMs = performance.now() - start;
  start = performance.now();
  const wholes = sources.map((source) => engine.parse(source, { depth: Infinity }));
  const wholeReadMs = performance.now() - start;
  return { times: { parseMs, renderMs, editMs, releaseMs, wholeReadMs, pipelineMs: parseMs + renderMs }, roots, renders, editedRenders, wholes };
}
