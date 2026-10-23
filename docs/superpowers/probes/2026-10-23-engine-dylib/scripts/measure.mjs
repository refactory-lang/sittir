// Memory and throughput across built variants (variants.mjs output), each
// run in a fresh process. Variants take turns within each round, so drift in
// the machine's load falls on all of them alike. Writes <out>/measure.json
// with every run and the median per cell.
//
//   node measure.mjs --variants <dir> --corpus <dir> --out <dir> [--rounds 5] [--idle <command>]
//     [--names today-release,dylib-release] [--throughput rust,python] [--iterations 20]
//
// `--idle` runs before every measurement and must exit 0 (a wait-for-idle
// gate). Memory is measured with rust alone and with all five grammars.
import { execSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { report } from './layout.mjs';

const ALL = ['rust', 'typescript', 'python', 'scm', 'regex'];
const { values } = parseArgs({
	options: {
		variants: { type: 'string' },
		corpus: { type: 'string' },
		out: { type: 'string' },
		rounds: { type: 'string' },
		idle: { type: 'string' },
		names: { type: 'string' },
		throughput: { type: 'string' },
		iterations: { type: 'string' }
	}
});
const variantsDir = resolve(values.variants);
const names = values.names?.split(',') ?? readdirSync(variantsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
const rounds = Number(values.rounds ?? 5);
const throughputGrammars = (values.throughput ?? 'rust,python').split(',');
const addon = (variant, grammar) => join(variantsDir, variant, grammar, `sittir-${grammar}.node`);
const gate = () => values.idle && execSync(values.idle, { stdio: 'ignore' });

const runs = [];
const cells = [
	...['1', '5'].map((count) => ({ kind: 'memory', label: `memory:${count}`, grammars: count === '1' ? ['rust'] : ALL })),
	...throughputGrammars.map((grammar) => ({ kind: 'throughput', label: `throughput:${grammar}`, grammar }))
];
for (let round = 0; round < rounds; round++) {
	for (const cell of cells) {
		for (const variant of round % 2 === 0 ? names : [...names].reverse()) {
			gate();
			const result =
				cell.kind === 'memory'
					? report('memory.mjs', cell.grammars.map((g) => `${g}=${addon(variant, g)}`), ['--expose-gc'])
					: report('throughput.mjs', ['--corpus', join(values.corpus, `${cell.grammar}.json`), '--addon', addon(variant, cell.grammar), '--iterations', values.iterations ?? '20']);
			runs.push({ round, cell: cell.label, variant, result });
		}
	}
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const pick = (cell, variant, f) => median(runs.filter((r) => r.cell === cell && r.variant === variant && r.result.exit === undefined).map((r) => f(r.result)));
const medians = {};
for (const cell of cells) {
	for (const variant of names) {
		medians[`${cell.label}:${variant}`] =
			cell.kind === 'memory'
				? {
						loadedRss: pick(cell.label, variant, (r) => r.loaded.rss - r.before.rss),
						workedRss: pick(cell.label, variant, (r) => r.worked.rss - r.before.rss),
						workedHeapUsed: pick(cell.label, variant, (r) => r.worked.heapUsed - r.before.heapUsed),
						workedExternal: pick(cell.label, variant, (r) => r.worked.external - r.before.external),
						loadedFootprint: pick(cell.label, variant, (r) => (r.loaded.footprint ?? NaN) - (r.before.footprint ?? NaN)),
						workedFootprint: pick(cell.label, variant, (r) => (r.worked.footprint ?? NaN) - (r.before.footprint ?? NaN))
					}
				: {
						medianMs: pick(cell.label, variant, (r) => r.medianMs),
						minMs: pick(cell.label, variant, (r) => r.minMs),
						parseMs: pick(cell.label, variant, (r) => r.medianSplitMs.parse),
						readMs: pick(cell.label, variant, (r) => r.medianSplitMs.read),
						renderMs: pick(cell.label, variant, (r) => r.medianSplitMs.render),
						sources: pick(cell.label, variant, (r) => r.sources),
						leftOut: pick(cell.label, variant, (r) => r.leftOut)
					};
	}
}
const failures = runs.filter((r) => r.result.exit !== undefined);
mkdirSync(resolve(values.out), { recursive: true });
writeFileSync(join(resolve(values.out), 'measure.json'), `${JSON.stringify({ names, rounds, medians, failures, runs }, null, 2)}\n`);
console.log(JSON.stringify({ medians, failures: failures.length }, null, 2));
