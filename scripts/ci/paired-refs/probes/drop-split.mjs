// Usage: node --expose-gc drop-split.mjs <tree> <grammar> <storage> <seconds> <out>
// Runs <grammar>'s corpus batch (corpus-batch.mjs) for <seconds> after twenty
// warmup batches. Each batch reads the addon's split (dropSplit, the probe
// build's per-part time and allocation counts) twice: right after its timed
// parse, with this thread's allocation counts over the parse (allocCounts,
// from the preloaded interposer), and after releasing the batch's roots and
// whole reads (releaseMs). A full GC and finalizer drain follow. Writes each
// part's mean per batch as <out>; an addon without dropSplit writes
// { skipped: true }.
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
if (typeof native.dropSplit !== 'function' || typeof native.allocCounts !== 'function') {
	writeFileSync(out, JSON.stringify({ grammar, nodeStorage, skipped: true }) + '\n');
	process.exit(0);
}
const PARTS = ['detach', 'sides', 'rows', 'arena', 'records', 'slotsItems', 'placementShapes', 'placementHeapMaps', 'placementBtrees', 'placementStateRest', 'placementPublished', 'lines', 'depthMembers', 'tree', 'rest', 'settle', 'releaseRoot', 'releaseParse', 'dropLiveTree', 'releaseBuilt', 'parse', 'trees'];
const FIELDS = ['ms', 'allocs', 'frees', 'allocBytes', 'freedBytes'];
const COUNTS = ['allocs', 'frees', 'allocBytes', 'freedBytes'];
const parts = (split) => Object.fromEntries(PARTS.map((part, at) => [part, Object.fromEntries(FIELDS.map((field, f) => [field, split[at * FIELDS.length + f] ?? 0]))]));
const sources = JSON.parse(readFileSync(path.join(here, '..', `corpus-${grammar}.json`), 'utf8')).map((entry) => entry.source);
const engine = await (await import(`${root}/packages/${grammar}/dist/index.js`)).default.createEngine({ nodeStorage });
const tick = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let sink = 0;
const batch = async (record) => {
	native.dropSplit();
	const before = native.allocCounts();
	let window = [];
	let parsed = [];
	const afterParse = () => {
		const after = native.allocCounts();
		window = after.map((count, at) => count - before[at]);
		parsed = native.dropSplit();
	};
	const { times, roots, renders, wholes } = corpusBatch(engine, sources, afterParse);
	sink += renders.reduce((sum, text) => sum + text.length, 0) + wholes.length;
	native.dropSplit();
	const start = performance.now();
	for (const node of [...roots, ...wholes]) node[Symbol.dispose]?.();
	const releaseMs = performance.now() - start;
	const released = native.dropSplit();
	globalThis.gc();
	await tick(0);
	globalThis.gc();
	await tick(0);
	record?.push({
		parseMs: times.parseMs,
		releaseMs,
		parses: roots.length,
		releases: roots.length + wholes.length,
		parseWindow: Object.fromEntries(COUNTS.map((key, at) => [key, window[at] ?? 0])),
		nativeParse: parts(parsed).parse,
		release: parts(released)
	});
};
const mean = (xs) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
const median = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1];
try {
	for (let i = 0; i < 20; i++) await batch(undefined);
	const samples = [];
	const end = performance.now() + seconds * 1000;
	while (performance.now() < end) await batch(samples);
	const result = {
		grammar,
		nodeStorage,
		cpu: cpuModel(),
		batches: samples.length,
		counted: samples.some((s) => s.parseWindow.allocs > 0),
		parseMs: median(samples.map((s) => s.parseMs)),
		releaseMs: mean(samples.map((s) => s.releaseMs)),
		parses: mean(samples.map((s) => s.parses)),
		releases: mean(samples.map((s) => s.releases)),
		parseWindow: Object.fromEntries(COUNTS.map((key) => [key, mean(samples.map((s) => s.parseWindow[key]))])),
		nativeParse: Object.fromEntries(FIELDS.map((key) => [key, mean(samples.map((s) => s.nativeParse[key]))])),
		release: Object.fromEntries(PARTS.map((part) => [part, Object.fromEntries(FIELDS.map((key) => [key, mean(samples.map((s) => s.release[part][key]))]))])),
		sink
	};
	writeFileSync(out, JSON.stringify(result) + '\n');
	console.log(JSON.stringify({ grammar, nodeStorage, batches: result.batches, counted: result.counted, releaseMs: result.releaseMs }));
} finally {
	engine.dispose();
}
