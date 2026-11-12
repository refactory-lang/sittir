// Usage: node --expose-gc parse-release.mjs <tree> <grammar> <storage> <variant> <out>
// Times <grammar>'s corpus batch (corpus-batch.mjs) as corpus-worker.mjs does,
// releasing each batch's roots and whole reads, untimed, at one point:
//   before:     right after the batch, just before the next batch's timed parse
//               (what corpus-worker.mjs does);
//   post-parse: the previous batch, right after the next batch's timed parse,
//               so no release precedes a timed parse;
//   gc:         as before, then a full GC and a finalizer drain, timed (gcMs),
//               the window a tree freed by its finalizer is freed in;
//   jemalloc:   as before; the runner preloads jemalloc for this variant.
// Every batch records the minor page faults its timed parse takes, and the GC
// time and events (perf_hooks 'gc' entries) inside its timed parse. Twenty
// warmup batches, fifty timed batches (samples), a full GC, a yield for
// finalizers, a second full GC, and fifty more (samplesMatched); an event-loop
// yield between batches. Writes the medians of each window as <out>.
import { readFileSync, writeFileSync } from 'node:fs';
import { constants, performance, PerformanceObserver } from 'node:perf_hooks';
import path from 'node:path';
import { cpuModel } from '../../arena-benchmark-cpu.mjs';
import { corpusBatch } from '../corpus-batch.mjs';
const [root, grammar, nodeStorage, variant, out] = process.argv.slice(2);
const VARIANTS = ['before', 'post-parse', 'gc', 'jemalloc'];
if (!VARIANTS.includes(variant)) throw new Error(`unknown variant ${variant}`);
const here = path.dirname(new URL(import.meta.url).pathname);
const sources = JSON.parse(readFileSync(path.join(here, '..', `corpus-${grammar}.json`), 'utf8')).map((entry) => entry.source);
const engine = await (await import(`${root}/packages/${grammar}/dist/index.js`)).default.createEngine({ nodeStorage });
const faults = () => process.resourceUsage().minorPageFault;
const release = (nodes) => {
	const start = performance.now();
	for (const node of nodes) node[Symbol.dispose]?.();
	return performance.now() - start;
};
const tick = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const gcs = [];
const observer = new PerformanceObserver((list) => {
	for (const entry of list.getEntries()) gcs.push({ start: entry.startTime, end: entry.startTime + entry.duration, kind: entry.detail?.kind });
});
observer.observe({ entryTypes: ['gc'] });
const KINDS = { major: constants.NODE_PERFORMANCE_GC_MAJOR, minor: constants.NODE_PERFORMANCE_GC_MINOR, incremental: constants.NODE_PERFORMANCE_GC_INCREMENTAL, weak: constants.NODE_PERFORMANCE_GC_WEAKCB };
const inParse = (sample) => {
	const hits = gcs.filter((gc) => gc.end > sample.parseStart && gc.start < sample.parseEnd);
	const overlap = hits.reduce((sum, gc) => sum + Math.min(gc.end, sample.parseEnd) - Math.max(gc.start, sample.parseStart), 0);
	return { parseGcMs: overlap, parseGcs: hits.length, ...Object.fromEntries(Object.entries(KINDS).map(([name, kind]) => [`parseGc_${name}`, hits.filter((gc) => gc.kind === kind).length])) };
};
let held = [];
let sink = 0;
const batch = async (record) => {
	let heldReleaseMs = 0;
	let gcMs = 0;
	const faultsBefore = faults();
	let parseFaults = 0;
	let parseEnd = 0;
	const afterParse = () => {
		parseEnd = performance.now();
		parseFaults = faults() - faultsBefore;
		if (variant === 'post-parse') {
			heldReleaseMs = release(held);
			held = [];
		}
	};
	const { times, roots, renders, wholes } = corpusBatch(engine, sources, afterParse);
	sink += renders.reduce((sum, text) => sum + text.length, 0) + wholes.length;
	const parsed = [...roots, ...wholes];
	if (variant === 'none' || variant === 'post-parse') held.push(...parsed);
	else heldReleaseMs = release(parsed);
	if (variant === 'gc') {
		const start = performance.now();
		globalThis.gc();
		await tick(0);
		globalThis.gc();
		await tick(0);
		gcMs = performance.now() - start;
	}
	record?.push({ ...times, heldReleaseMs, gcMs, parseFaults, parseStart: parseEnd - times.parseMs, parseEnd });
	await new Promise(setImmediate);
};
const median = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1];
const mean = (xs) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
const GC_KEYS = ['parseGcMs', 'parseGcs', ...Object.keys(KINDS).map((name) => `parseGc_${name}`)];
const summary = (samples) => {
	const attributed = samples.map((s) => ({ ...s, ...inParse(s) }));
	return {
		...Object.fromEntries(['parseMs', 'renderMs', 'pipelineMs', 'editMs', 'wholeReadMs', 'heldReleaseMs', 'gcMs', 'parseFaults'].map((key) => [key, median(attributed.map((s) => s[key]))])),
		...Object.fromEntries(GC_KEYS.map((key) => [key, mean(attributed.map((s) => s[key]))])),
		parseMsWithoutGc: median(attributed.map((s) => s.parseMs - s.parseGcMs))
	};
};
try {
	for (let i = 0; i < 20; i++) await batch(undefined);
	const samples = [];
	for (let i = 0; i < 50; i++) await batch(samples);
	globalThis.gc();
	await tick(50);
	globalThis.gc();
	await tick(50);
	const samplesMatched = [];
	for (let i = 0; i < 50; i++) await batch(samplesMatched);
	await tick(50);
	const result = { grammar, nodeStorage, variant, cpu: cpuModel(), node: process.version, preload: process.env.LD_PRELOAD ?? null, samples: summary(samples), samplesMatched: summary(samplesMatched), heldAtEnd: held.length, sink };
	writeFileSync(out, JSON.stringify(result) + '\n');
	console.log(JSON.stringify({ grammar, nodeStorage, variant, parseMs: result.samples.parseMs, parseFaults: result.samples.parseFaults }));
} finally {
	release(held);
	engine.dispose();
}
