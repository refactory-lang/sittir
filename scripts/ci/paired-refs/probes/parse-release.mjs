// Usage: node --expose-gc parse-release.mjs <tree> <grammar> <storage> <variant> <out>
// Times <grammar>'s corpus batch (corpus-batch.mjs) as corpus-worker.mjs does,
// releasing each batch's roots and whole reads, untimed, at one point:
//   before: right after the batch, so just before the next batch's timed parse
//           (what corpus-worker.mjs does);
//   after:  after the next batch, so no release precedes a timed parse;
//   none:   never, so every parse stays held until the engine is disposed.
// Twenty warmup batches, fifty timed batches (samples), a full GC, a yield for
// finalizers, a second full GC, and fifty more (samplesMatched); an event-loop
// yield between batches. Writes the medians of each window as <out>.
import { readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import { cpuModel } from '../../arena-benchmark-cpu.mjs';
import { corpusBatch } from '../corpus-batch.mjs';
const [root, grammar, nodeStorage, variant, out] = process.argv.slice(2);
if (!['before', 'after', 'none'].includes(variant)) throw new Error(`unknown variant ${variant}`);
const here = path.dirname(new URL(import.meta.url).pathname);
const sources = JSON.parse(readFileSync(path.join(here, '..', `corpus-${grammar}.json`), 'utf8')).map((entry) => entry.source);
const engine = await (await import(`${root}/packages/${grammar}/dist/index.js`)).default.createEngine({ nodeStorage });
const release = (nodes) => {
	const start = performance.now();
	for (const node of nodes) node[Symbol.dispose]?.();
	return performance.now() - start;
};
let held = [];
let sink = 0;
const batch = (record) => {
	const { times, roots, renders, wholes } = corpusBatch(engine, sources);
	sink += renders.reduce((sum, text) => sum + text.length, 0) + wholes.length;
	const parsed = [...roots, ...wholes];
	let heldReleaseMs = 0;
	if (variant === 'before') heldReleaseMs = release(parsed);
	else if (variant === 'after') {
		heldReleaseMs = release(held);
		held = parsed;
	} else held.push(...parsed);
	record?.push({ ...times, heldReleaseMs, held: held.length });
};
const median = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1];
const summary = (samples) =>
	Object.fromEntries(['parseMs', 'renderMs', 'pipelineMs', 'editMs', 'wholeReadMs', 'heldReleaseMs'].map((key) => [key, median(samples.map((s) => s[key]))]));
try {
	for (let i = 0; i < 20; i++) {
		batch(undefined);
		await new Promise(setImmediate);
	}
	const samples = [];
	for (let i = 0; i < 50; i++) {
		batch(samples);
		await new Promise(setImmediate);
	}
	globalThis.gc();
	await new Promise((resolve) => setTimeout(resolve, 50));
	globalThis.gc();
	await new Promise((resolve) => setTimeout(resolve, 50));
	const samplesMatched = [];
	for (let i = 0; i < 50; i++) {
		batch(samplesMatched);
		await new Promise(setImmediate);
	}
	const result = { grammar, nodeStorage, variant, cpu: cpuModel(), node: process.version, samples: summary(samples), samplesMatched: summary(samplesMatched), heldAtEnd: held.length, sink };
	writeFileSync(out, JSON.stringify(result) + '\n');
	console.log(JSON.stringify({ grammar, nodeStorage, variant, parseMs: result.samples.parseMs, matchedParseMs: result.samplesMatched.parseMs }));
} finally {
	release(held);
	engine.dispose();
}
