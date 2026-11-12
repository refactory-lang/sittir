// Usage: node --expose-gc drop-split.mjs <tree> <grammar> <storage> <seconds> <out>
// Runs <grammar>'s corpus batch (corpus-batch.mjs) for <seconds> after twenty
// warmup batches. After every batch it zeroes the addon's drop split, releases
// the batch's roots and whole reads (releaseMs), reads the split of that
// release (dropSplit: the probe build's timers, ms per part), then runs a full
// GC and a finalizer drain. Writes each part's mean and median per batch as
// <out>; an addon without dropSplit writes { skipped: true }.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import { cpuModel } from '../../arena-benchmark-cpu.mjs';
import { corpusBatch } from '../corpus-batch.mjs';
const [root, grammar, nodeStorage, secondsArg, out] = process.argv.slice(2);
const seconds = Number(secondsArg);
const here = path.dirname(new URL(import.meta.url).pathname);
const native = createRequire(import.meta.url)(`${root}/packages/${grammar}/native/index.cjs`);
if (typeof native.dropSplit !== 'function') {
	writeFileSync(out, JSON.stringify({ grammar, nodeStorage, skipped: true }) + '\n');
	process.exit(0);
}
const PARTS = ['detach', 'sides', 'rows', 'arena', 'records', 'slotsItems', 'placement', 'tree', 'rest', 'settle', 'releaseRoot', 'releaseParse', 'dropLiveTree', 'trees', 'releaseBuilt'];
const sources = JSON.parse(readFileSync(path.join(here, '..', `corpus-${grammar}.json`), 'utf8')).map((entry) => entry.source);
const engine = await (await import(`${root}/packages/${grammar}/dist/index.js`)).default.createEngine({ nodeStorage });
const tick = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let sink = 0;
const batch = async (record) => {
	const { times, roots, renders, wholes } = corpusBatch(engine, sources);
	sink += renders.reduce((sum, text) => sum + text.length, 0) + wholes.length;
	native.dropSplit();
	const start = performance.now();
	for (const node of [...roots, ...wholes]) node[Symbol.dispose]?.();
	const releaseMs = performance.now() - start;
	const split = native.dropSplit();
	globalThis.gc();
	await tick(0);
	globalThis.gc();
	await tick(0);
	record?.push({ parseMs: times.parseMs, releaseMs, ...Object.fromEntries(PARTS.map((part, at) => [part, split[at] ?? 0])), released: roots.length + wholes.length });
};
const median = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1];
const mean = (xs) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
try {
	for (let i = 0; i < 20; i++) await batch(undefined);
	const samples = [];
	const end = performance.now() + seconds * 1000;
	while (performance.now() < end) await batch(samples);
	const keys = ['parseMs', 'releaseMs', ...PARTS, 'released'];
	const result = {
		grammar,
		nodeStorage,
		cpu: cpuModel(),
		batches: samples.length,
		mean: Object.fromEntries(keys.map((key) => [key, mean(samples.map((s) => s[key]))])),
		median: Object.fromEntries(keys.map((key) => [key, median(samples.map((s) => s[key]))])),
		sink
	};
	writeFileSync(out, JSON.stringify(result) + '\n');
	console.log(JSON.stringify(result));
} finally {
	engine.dispose();
}
