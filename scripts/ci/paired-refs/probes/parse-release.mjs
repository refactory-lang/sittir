// Usage: node --expose-gc parse-release.mjs <tree> <grammar> <storage> <variant> <out>
// Times <grammar>'s corpus batch (corpus-batch.mjs) as corpus-worker.mjs does,
// releasing each batch's roots and whole reads, untimed, at one point:
//   before:     right after the batch, just before the next batch's timed parse
//               (what corpus-worker.mjs does);
//   post-parse: the previous batch, right after the next batch's timed parse,
//               so no release precedes a timed parse;
//   sleep:      as before, then 20 ms before the next batch;
//   tunables:   as before; the runner sets GLIBC_TUNABLES for this variant;
//   gc:         as before, then a full GC and a finalizer drain, timed (gcMs),
//               the window a tree freed by its finalizer is freed in;
//   none:       never, so every parse stays held until the engine is disposed.
// Every batch records the minor page faults its timed parse takes. Twenty
// warmup batches, fifty timed batches (samples), a full GC, a yield for
// finalizers, a second full GC, and fifty more (samplesMatched); an event-loop
// yield between batches. Writes the medians of each window as <out>.
import { readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import { cpuModel } from '../../arena-benchmark-cpu.mjs';
import { corpusBatch } from '../corpus-batch.mjs';
const [root, grammar, nodeStorage, variant, out] = process.argv.slice(2);
const VARIANTS = ['before', 'post-parse', 'sleep', 'tunables', 'gc', 'none'];
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
let held = [];
let sink = 0;
const batch = async (record) => {
	let heldReleaseMs = 0;
	let gcMs = 0;
	const faultsBefore = faults();
	let parseFaults = 0;
	const afterParse = () => {
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
	record?.push({ ...times, heldReleaseMs, gcMs, parseFaults });
	if (variant === 'sleep') await tick(20);
	else await new Promise(setImmediate);
};
const median = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1];
const summary = (samples) =>
	Object.fromEntries(['parseMs', 'renderMs', 'pipelineMs', 'editMs', 'wholeReadMs', 'heldReleaseMs', 'gcMs', 'parseFaults'].map((key) => [key, median(samples.map((s) => s[key]))]));
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
	const result = { grammar, nodeStorage, variant, cpu: cpuModel(), node: process.version, glibcTunables: process.env.GLIBC_TUNABLES ?? null, samples: summary(samples), samplesMatched: summary(samplesMatched), heldAtEnd: held.length, sink };
	writeFileSync(out, JSON.stringify(result) + '\n');
	console.log(JSON.stringify({ grammar, nodeStorage, variant, parseMs: result.samples.parseMs, parseFaults: result.samples.parseFaults }));
} finally {
	release(held);
	engine.dispose();
}
