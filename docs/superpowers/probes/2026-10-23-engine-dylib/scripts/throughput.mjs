// Parse + read + render throughput of one grammar addon over its corpus,
// straight on the native addon: per source, `parse`, `read` of the root at
// every depth, `render` of what was read, `disposeTree`. Sources that fail in
// the warmup pass are left out of the timed passes and counted.
//
//   node throughput.mjs --corpus <grammar.json> --addon <file.node> [--iterations N]
//
// Prints one JSON line: sources timed, sources left out, per-pass
// milliseconds (min, median, mean) and the split of the median pass across
// parse, read and render.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { corpus: { type: 'string' }, addon: { type: 'string' }, iterations: { type: 'string' } } });
if (!values.corpus || !values.addon) throw new Error('usage: throughput.mjs --corpus <grammar.json> --addon <file.node> [--iterations N]');
const native = createRequire(import.meta.url)(values.addon);
const engine = new native.SittirEngine();
const iterations = Number(values.iterations ?? 20);

function once(source, split) {
	const t0 = process.hrtime.bigint();
	const { treeId } = JSON.parse(engine.parse(source));
	const t1 = process.hrtime.bigint();
	const node = engine.read(treeId, 0, Infinity);
	const t2 = process.hrtime.bigint();
	engine.render(node, treeId);
	const t3 = process.hrtime.bigint();
	native.disposeTree(treeId);
	split[0] += Number(t1 - t0);
	split[1] += Number(t2 - t1);
	split[2] += Number(t3 - t2);
}

const all = JSON.parse(readFileSync(values.corpus, 'utf8'));
const warmup = [0, 0, 0];
const sources = all.filter((source) => {
	try {
		once(source, warmup);
		return true;
	} catch {
		return false;
	}
});

const passes = [];
for (let i = 0; i < iterations; i++) {
	const split = [0, 0, 0];
	const start = process.hrtime.bigint();
	for (const source of sources) once(source, split);
	passes.push({ ms: Number(process.hrtime.bigint() - start) / 1e6, split: split.map((ns) => ns / 1e6) });
}
const sorted = [...passes].sort((a, b) => a.ms - b.ms);
const median = sorted[Math.floor(sorted.length / 2)];
console.log(
	JSON.stringify({
		sources: sources.length,
		leftOut: all.length - sources.length,
		iterations,
		minMs: sorted[0].ms,
		medianMs: median.ms,
		meanMs: passes.reduce((sum, pass) => sum + pass.ms, 0) / passes.length,
		medianSplitMs: { parse: median.split[0], read: median.split[1], render: median.split[2] }
	})
);
