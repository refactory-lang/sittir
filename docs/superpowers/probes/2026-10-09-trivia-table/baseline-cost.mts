/**
 * What the read-time baseline costs a tree: over every corpus entry of each grammar, the time and
 * peak memory of computing what the tree stores of its layout (`storedLayout`, which renders the
 * baseline records the deviation test reads), against a plain render of the same tree from its
 * templates (read to full depth, rendered under its options).
 *
 * Each mode runs in a child process of its own, so its peak resident size (`maxRSS`) is its own;
 * the `parse` mode only parses, giving the floor the other two are read against. Each mode makes
 * `passes` passes over the corpus and reports its fastest pass, wall and user+sys.
 *
 *   SITTIR_BACKEND=native ./node_modules/.bin/tsx docs/superpowers/probes/2026-10-09-trivia-table/baseline-cost.mts [passes]
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { AnyUntypedNode } from '@sittir/types';
import { loadCorpusEntries, loadNativeEngine, materializeDetached, nativeLanguageEngineOf, readNativeTree, readNodeOf } from '../../../../packages/tools/src/validate/common.ts';
import { storedLayoutOf } from '../../../../packages/tools/src/validate/layout-runs.ts';

const grammars = ['rust', 'typescript', 'python', 'scm', 'regex'] as const;
const modes = ['parse', 'plain', 'baseline'] as const;
type Mode = (typeof modes)[number];

interface Measure {
	readonly wallMs: number;
	readonly cpuMs: number;
	readonly maxRssMb: number;
}

async function runner(grammar: string, mode: Mode): Promise<(source: string) => void> {
	const engine = await loadNativeEngine(grammar);
	if (mode === 'baseline') {
		const storedOf = await storedLayoutOf(grammar);
		return (source) => void storedOf(source);
	}
	const readNode = await readNodeOf(grammar);
	const native = await nativeLanguageEngineOf(grammar);
	if (readNode === null) throw new Error(`no readNode for ${grammar}`);
	return (source) => {
		const { tree } = readNativeTree(engine, source);
		if (mode === 'plain') native.render(materializeDetached(readNode(tree)) as AnyUntypedNode, tree.options).toString();
	};
}

async function child(grammar: string, mode: Mode, passes: number): Promise<Measure> {
	const run = await runner(grammar, mode);
	const sources = loadCorpusEntries(grammar).map(({ source }) => source);
	let best: { wallMs: number; cpuMs: number } | undefined;
	for (let pass = 0; pass < passes; pass++) {
		const cpu = process.cpuUsage();
		const start = process.hrtime.bigint();
		for (const source of sources) run(source);
		const wallMs = Number(process.hrtime.bigint() - start) / 1e6;
		const used = process.cpuUsage(cpu);
		const cpuMs = (used.user + used.system) / 1e3;
		if (best === undefined || wallMs < best.wallMs) best = { wallMs, cpuMs };
	}
	return { ...best!, maxRssMb: process.resourceUsage().maxRSS / 1024 };
}

const [, , first, second, third] = process.argv;
if (first === '--child') {
	process.stdout.write(JSON.stringify(await child(second!, third as Mode, Number(process.argv[5] ?? 3))));
} else {
	const passes = Number(first ?? 3);
	const self = fileURLToPath(import.meta.url);
	const rows: string[] = ['| grammar | entries | parse ms | plain ms | baseline ms | baseline ÷ plain | parse MB | plain MB | baseline MB |', '|---|---|---|---|---|---|---|---|---|'];
	for (const grammar of grammars) {
		const measured = {} as Record<Mode, Measure>;
		for (const mode of modes) {
			const out = execFileSync(process.execPath, [...process.execArgv, self, '--child', grammar, mode, String(passes)], { encoding: 'utf8', env: process.env });
			measured[mode] = JSON.parse(out) as Measure;
		}
		const ms = (mode: Mode) => `${measured[mode].wallMs.toFixed(1)} (${measured[mode].cpuMs.toFixed(0)})`;
		const mb = (mode: Mode) => measured[mode].maxRssMb.toFixed(0);
		const ratio = (measured.baseline.wallMs - measured.parse.wallMs) / (measured.plain.wallMs - measured.parse.wallMs);
		rows.push(`| ${grammar} | ${loadCorpusEntries(grammar).length} | ${ms('parse')} | ${ms('plain')} | ${ms('baseline')} | ${ratio.toFixed(2)} | ${mb('parse')} | ${mb('plain')} | ${mb('baseline')} |`);
	}
	console.log(rows.join('\n'));
}
