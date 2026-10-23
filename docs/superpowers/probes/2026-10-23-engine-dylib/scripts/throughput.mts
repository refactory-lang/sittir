// Parse + read + render throughput of one grammar addon over its corpus,
// straight on the native addon: per fixture, `parse`, `read` of the root at
// every depth, `render` of what was read, `disposeTree`. Fixtures that fail
// in the warmup pass are left out of the timed passes and counted.
//
//   tsx throughput.mts --grammar <name> --addon <file.node> [--iterations N]
//
// Prints one JSON line: fixtures, left out, per-pass milliseconds (min,
// median, mean) and the split of the median pass across parse, read and
// render.
import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';
import { loadCorpusEntries } from '../../../../../packages/tools/src/validate/common.ts';

interface NativeAddon {
	SittirEngine: new () => {
		parse(source: string): string;
		read(treeId: number, index: number, depth?: number): unknown;
		render(node: unknown, treeId?: number): string;
	};
	disposeTree(treeId: number): void;
}

const { values } = parseArgs({ options: { grammar: { type: 'string' }, addon: { type: 'string' }, iterations: { type: 'string' } } });
if (!values.grammar || !values.addon) throw new Error('usage: throughput.mts --grammar <name> --addon <file.node> [--iterations N]');
const native = createRequire(import.meta.url)(values.addon) as NativeAddon;
const engine = new native.SittirEngine();
const iterations = Number(values.iterations ?? 20);

function once(source: string, split: number[]): void {
	const t0 = process.hrtime.bigint();
	const { treeId } = JSON.parse(engine.parse(source)) as { treeId: number };
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

const all = loadCorpusEntries(values.grammar).map((entry) => entry.source);
const scratch = [0, 0, 0];
const sources = all.filter((source) => {
	try {
		once(source, scratch);
		return true;
	} catch {
		return false;
	}
});

const passes: { ms: number; split: number[] }[] = [];
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
		grammar: values.grammar,
		fixtures: sources.length,
		leftOut: all.length - sources.length,
		iterations,
		minMs: sorted[0].ms,
		medianMs: median.ms,
		meanMs: passes.reduce((sum, pass) => sum + pass.ms, 0) / passes.length,
		medianSplitMs: { parse: median.split[0], read: median.split[1], render: median.split[2] }
	})
);
