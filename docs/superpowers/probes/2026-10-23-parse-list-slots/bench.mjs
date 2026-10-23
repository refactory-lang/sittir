// One measurement in a fresh process: a grammar's corpus through one variant.
// Time mode prints the median ms of the timed passes; memory mode holds every
// tree after the variant's stage and prints what the process retains.
//
//   node --expose-gc bench.mjs --grammar python --variant b --corpus corpus-python.json
//   node --expose-gc bench.mjs --grammar python --variant b --corpus corpus-python.json --memory

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const { values } = parseArgs({
	options: {
		grammar: { type: 'string' },
		variant: { type: 'string' },
		corpus: { type: 'string' },
		passes: { type: 'string', default: '100' },
		warmup: { type: 'string', default: '10' },
		copies: { type: 'string', default: '5' },
		memory: { type: 'boolean', default: false }
	}
});

const native = createRequire(import.meta.url)(join(ROOT, 'packages', values.grammar, 'native/index.cjs'));
const engine = new native.SittirEngine();
const sources = JSON.parse(readFileSync(values.corpus, 'utf8'));

const counts = { trees: 0, nodes: 0, routed: 0, withLists: 0, lists: 0, runs: 0, readRefused: 0 };
let tally = false;

const measure = (treeId) => {
	const [nodes, routed, withLists, lists] = engine.probeMeasureListSlots(treeId);
	if (tally) Object.assign(counts, { nodes: counts.nodes + nodes, routed: counts.routed + routed, withLists: counts.withLists + withLists, lists: counts.lists + lists });
};
const read = (treeId) => {
	try {
		engine.read(treeId, 0, Infinity);
	} catch {
		if (tally) counts.readRefused += 1;
	}
};
const trivia = (treeId) => {
	const runs = engine.probeTrivia(treeId);
	if (tally) counts.runs += runs;
};

const stages = {
	a: () => {},
	t: trivia,
	b: measure,
	c: read,
	d: (treeId) => {
		measure(treeId);
		read(treeId);
	}
};
const stage = stages[values.variant];
if (stage === undefined) throw new Error(`unknown variant ${values.variant}`);

const parse = (source) => JSON.parse(engine.parse(source)).treeId;

const pass = () => {
	for (const source of sources) {
		const treeId = parse(source);
		stage(treeId);
		native.disposeTree(treeId);
	}
};

const median = (xs) => {
	const sorted = [...xs].sort((x, y) => x - y);
	const mid = sorted.length >> 1;
	return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

if (values.memory) {
	globalThis.gc();
	globalThis.gc();
	const before = process.memoryUsage();
	const held = [];
	for (let copy = 0; copy < Number(values.copies); copy += 1) {
		for (const source of sources) {
			const treeId = parse(source);
			stage(treeId);
			held.push(treeId);
		}
	}
	globalThis.gc();
	await new Promise((resolve) => setTimeout(resolve, 50));
	globalThis.gc();
	const after = process.memoryUsage();
	process.stdout.write(
		`${JSON.stringify({
			memory: {
				trees: held.length,
				live: native.liveTreeCount(),
				rss: after.rss - before.rss,
				heap: after.heapUsed - before.heapUsed,
				external: after.external - before.external
			}
		})}\n`
	);
} else {
	tally = true;
	counts.trees = sources.length;
	pass();
	tally = false;
	for (let at = 1; at < Number(values.warmup); at += 1) pass();
	globalThis.gc();
	const times = [];
	for (let at = 0; at < Number(values.passes); at += 1) {
		const start = performance.now();
		pass();
		times.push(performance.now() - start);
	}
	process.stdout.write(`${JSON.stringify({ ms: median(times), min: Math.min(...times), max: Math.max(...times), counts })}\n`);
}
