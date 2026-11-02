// Usage: node --expose-gc parse-profile.mjs <tree> <grammar> <storage> <out-prefix> <batches>
// Times <grammar>'s corpus batch (parse, then render) as waiting-trees.mjs does
// with no trees held: a full GC and a yield after every batch, outside the
// timed windows. Records a CPU profile of the timed batches only (inspector
// Profiler, 50 us sampling) as <out-prefix>.cpuprofile, and the medians as
// <out-prefix>.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { Session } from 'node:inspector/promises';
import { performance } from 'node:perf_hooks';
import os from 'node:os';
import path from 'node:path';
const [root, grammar, nodeStorage, out, batchesArg] = process.argv.slice(2);
const batches = Number(batchesArg);
const here = path.dirname(new URL(import.meta.url).pathname);
const entries = JSON.parse(readFileSync(path.join(here, '..', `corpus-${grammar}.json`), 'utf8'));
const engine = await (await import(`${root}/packages/${grammar}/dist/index.js`)).default.createEngine({ nodeStorage });
const settle = async () => { globalThis.gc(); await new Promise((r) => setTimeout(r, 0)); globalThis.gc(); await new Promise((r) => setTimeout(r, 0)); };
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
const session = new Session();
session.connect();
await session.post('Profiler.enable');
await session.post('Profiler.setSamplingInterval', { interval: 50 });
await session.post('Profiler.start');
const samples = [];
for (let i = 0; i < batches; i++) { samples.push(batch()); await settle(); }
const { profile } = await session.post('Profiler.stop');
session.disconnect();
const median = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1];
const result = { grammar, nodeStorage, batches, cpu: os.cpus()[0].model, parseMs: median(samples.map((s) => s.parseMs)), renderMs: median(samples.map((s) => s.renderMs)), pipelineMs: median(samples.map((s) => s.parseMs + s.renderMs)), sink };
writeFileSync(`${out}.cpuprofile`, JSON.stringify(profile));
writeFileSync(`${out}.json`, JSON.stringify(result) + '\n');
console.log(JSON.stringify({ grammar, nodeStorage, parseMs: result.parseMs, renderMs: result.renderMs }));
