// Usage: node --expose-gc release-profile.mjs <tree> <grammar> <storage> <seconds> <out>
// Runs <grammar>'s corpus batch (corpus-batch.mjs) for <seconds> after twenty
// warmup batches. After every batch it releases the batch's roots and whole
// reads (releaseMs), then runs a full GC and a finalizer drain (gcMs), so a
// tree its finalizer frees is freed in a window of its own. Writes the medians,
// and the batch count, as <out>.
import { readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import { cpuModel } from '../../arena-benchmark-cpu.mjs';
import { corpusBatch } from '../corpus-batch.mjs';
const [root, grammar, nodeStorage, secondsArg, out] = process.argv.slice(2);
const seconds = Number(secondsArg);
const here = path.dirname(new URL(import.meta.url).pathname);
const sources = JSON.parse(readFileSync(path.join(here, '..', `corpus-${grammar}.json`), 'utf8')).map((entry) => entry.source);
const engine = await (await import(`${root}/packages/${grammar}/dist/index.js`)).default.createEngine({ nodeStorage });
const tick = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let sink = 0;
const batch = async (record) => {
	const { times, roots, renders, wholes } = corpusBatch(engine, sources);
	sink += renders.reduce((sum, text) => sum + text.length, 0) + wholes.length;
	let start = performance.now();
	for (const node of [...roots, ...wholes]) node[Symbol.dispose]?.();
	const releaseMs = performance.now() - start;
	start = performance.now();
	globalThis.gc();
	await tick(0);
	globalThis.gc();
	await tick(0);
	record?.push({ parseMs: times.parseMs, releaseMs, gcMs: performance.now() - start, parsed: roots.length + wholes.length });
};
const median = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1];
try {
	for (let i = 0; i < 20; i++) await batch(undefined);
	const samples = [];
	const end = performance.now() + seconds * 1000;
	while (performance.now() < end) await batch(samples);
	const result = { grammar, nodeStorage, cpu: cpuModel(), batches: samples.length, parsedPerBatch: samples[0]?.parsed, ...Object.fromEntries(['parseMs', 'releaseMs', 'gcMs'].map((key) => [key, median(samples.map((s) => s[key]))])), sink };
	writeFileSync(out, JSON.stringify(result) + '\n');
	console.log(JSON.stringify(result));
} finally {
	engine.dispose();
}
