// Usage: node --expose-gc waiting-trees.mjs <tree> <grammar> <storage> <out.json> <hold-grammar> <held>
// Holds <held> live trees of <hold-grammar> (their roots in an array), then
// times <grammar>'s corpus batch (parse, then render) with a full GC and a
// yield after every batch, outside the timed windows, so the only trees alive
// are the held ones and the batch's own. Records the median parse and render
// milliseconds, the live tree count and RSS.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import os from 'node:os';
import path from 'node:path';
const [root, grammar, nodeStorage, out, holdGrammar, heldArg] = process.argv.slice(2);
const held = Number(heldArg);
const here = path.dirname(new URL(import.meta.url).pathname);
const corpusOf = (g) => JSON.parse(readFileSync(path.join(here, '..', `corpus-${g}.json`), 'utf8'));
const load = async (g) => (await import(`${root}/packages/${g}/dist/index.js`)).default.createEngine({ nodeStorage });
const engine = await load(grammar);
const holder = holdGrammar === grammar ? engine : await load(holdGrammar);
const require = createRequire(import.meta.url);
const liveOf = (g) => require(`${root}/packages/${g}/native/index.cjs`).liveTreeCount?.();
const entries = corpusOf(grammar);
const holdEntries = corpusOf(holdGrammar);
const roots = [];
for (let n = 0; roots.length < held; n++) roots.push(holder.parse(holdEntries[n % holdEntries.length].source));
const settle = async () => { globalThis.gc(); await new Promise((r) => setTimeout(r, 0)); globalThis.gc(); await new Promise((r) => setTimeout(r, 0)); };
await settle();
let sink = 0;
const batch = () => {
	let start = performance.now();
	const parsed = entries.map((e) => engine.parse(e.source));
	const parseMs = performance.now() - start;
	start = performance.now();
	for (const node of parsed) sink += engine.render(node).toString().length;
	return { parseMs, renderMs: performance.now() - start };
};
for (let i = 0; i < 300; i++) { batch(); if (i % 20 === 19) await settle(); }
await settle();
const samples = [];
for (let i = 0; i < 60; i++) { samples.push(batch()); await settle(); }
const median = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1];
const result = { grammar, nodeStorage, holdGrammar, held, cpu: os.cpus()[0].model, parseMs: median(samples.map((s) => s.parseMs)), renderMs: median(samples.map((s) => s.renderMs)), pipelineMs: median(samples.map((s) => s.parseMs + s.renderMs)), liveTrees: { [grammar]: liveOf(grammar), [holdGrammar]: liveOf(holdGrammar) }, rssMB: process.memoryUsage.rss() / 2 ** 20, heldRoots: roots.length, sink };
writeFileSync(out, JSON.stringify(result) + '\n');
console.log(JSON.stringify({ grammar, holdGrammar, held, pipelineMs: result.pipelineMs }));
