/**
 * Measures the type-check cost of each variant generate.mts wrote, like for like: the same compiler, flags and
 * consumer rule, each variant copied out of the repository first so no file watcher reacts to the runs.
 *
 * Per variant it runs `tsc -p tsconfig.json --extendedDiagnostics --singleThreaded` RUNS times and reports the median
 * of each figure, with the load average before and after.
 *
 * Usage: `tsx cost.mts [<scratch dir>] [<variant>...]` (default: a fresh directory under the system temp directory;
 * every variant under out/).
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { loadavg, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { OUT, ROOT } from './lib.mts';

const RUNS = 7;
const FIGURES = ['Types', 'Instantiations', 'Memory used', 'Check time', 'Total time'] as const;
const TSC = join(ROOT, 'node_modules/.bin/tsc');

const scratch = resolve(process.argv[2] ?? mkdtempSync(join(tmpdir(), 'vocabulary-features-cost-')));
const variants = process.argv.length > 3 ? process.argv.slice(3) : ['today', 'fold', 'gate', 'scale-gate', 'scale-registry'].filter((v) => readdirSync(OUT).includes(v));

const median = (xs: readonly number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
const load = (): string => loadavg().map((l) => l.toFixed(2)).join(' ');

console.log(`tsc ${execFileSync(TSC, ['--version'], { encoding: 'utf8' }).trim()}; ${RUNS} runs each; scratch ${scratch}`);
console.log(`load before: ${load()}`);
const rows: string[][] = [];
for (const variant of variants) {
	const dir = join(scratch, variant);
	rmSync(dir, { recursive: true, force: true });
	cpSync(join(OUT, variant), dir, { recursive: true });
	const samples = new Map<string, number[]>(FIGURES.map((f) => [f, []]));
	for (let i = 0; i < RUNS; i++) {
		const out = execFileSync(TSC, ['-p', join(dir, 'tsconfig.json'), '--extendedDiagnostics', '--singleThreaded'], { encoding: 'utf8' });
		for (const f of FIGURES) {
			const m = new RegExp(`^${f}:\\s+([\\d.]+)`, 'm').exec(out);
			if (!m) throw new Error(`${variant}: no ${f} in the diagnostics`);
			samples.get(f)!.push(Number(m[1]));
		}
	}
	rows.push([variant, ...FIGURES.map((f) => String(median(samples.get(f)!)))]);
}
console.log(`load after: ${load()}`);
const header = ['variant', 'Types', 'Instantiations', 'Memory used (K)', 'Check time (s)', 'Total time (s)'];
console.log(`| ${header.join(' | ')} |`);
console.log(`| ${header.map(() => '---').join(' | ')} |`);
for (const r of rows) console.log(`| ${r.join(' | ')} |`);
