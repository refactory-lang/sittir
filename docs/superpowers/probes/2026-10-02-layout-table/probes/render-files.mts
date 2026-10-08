/**
 * Measures: what a width setting does to real files. Renders the factory
 *   rebuilds of four repo files and reports the output's size and line
 *   widths, and the time of one engine.render call split into the
 *   TypeScript projection and the native part.
 * Needs:  fixtures (make-fixtures.sh). `off` runs on any checkout; a width
 *   needs a prototype variant built for rust and typescript; a rule other
 *   than `group` needs the validation variant.
 * Run (from the root of the checkout to measure):
 *   ./node_modules/.bin/tsx <probes>/render-files.mts [off|<width>] [group|fill|hug]
 * Prints: one line per file: bytes, lines, widest line, lines over 100 and
 *   over 120 columns (a tab counts as one), best-of-15 render time, the
 *   projection's share, and native time per output byte.
 * Writes: each rendering to scratchpad/layout/out-<file>-<width>[-<rule>].txt.
 */
import { performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';
import { FILES, ROOT, WORK, engineFor, fixture } from './root.mts';

const { toTransportData } = await import(`${ROOT}packages/common/src/transport-data.ts`);

const width = process.argv[2] === undefined || process.argv[2] === 'off' ? undefined : Number(process.argv[2]);
const rule = process.argv[3];
const layout = width === undefined ? {} : { width, ...(rule === undefined ? {} : { breaking: rule }) };

const columns = (line: string, tab: number): number => {
	let n = 0;
	for (const ch of line) n += ch === '\t' ? tab : 1;
	return n;
};

const best = (fn: () => unknown, rounds = 15, per = 20): number => {
	for (let i = 0; i < 30; i++) fn();
	let low = Infinity;
	for (let r = 0; r < rounds; r++) {
		const t0 = performance.now();
		for (let i = 0; i < per; i++) fn();
		low = Math.min(low, (performance.now() - t0) / per);
	}
	return low;
};

for (const [grammar, name, file, exportName, base] of FILES) {
	const engine = await engineFor(grammar, { ...base, ...layout });
	const node = await fixture(file, exportName);
	const text = String(engine.render(node as never));
	writeFileSync(`${WORK}out-${name}-${width ?? 'off'}${rule === undefined ? '' : '-' + rule}.txt`, text);
	const lines = text.split('\n');
	const widths = lines.map((line) => columns(line, 1));
	const over = (limit: number) => widths.filter((w) => w > limit).length;
	const total = best(() => String(engine.render(node as never)));
	const project = best(() => toTransportData(node));
	const native = total - project;
	console.log(
		`${name.padEnd(10)} ${String(text.length).padStart(6)} B ${String(lines.length).padStart(4)} lines  max ${String(Math.max(...widths)).padStart(3)}  >100: ${String(over(100)).padStart(2)}  >120: ${String(over(120)).padStart(2)}` +
			`  render ${total.toFixed(3)} ms  project ${project.toFixed(3)} ms  native ${native.toFixed(3)} ms = ${((native * 1e6) / text.length).toFixed(1)} ns/B`
	);
}
