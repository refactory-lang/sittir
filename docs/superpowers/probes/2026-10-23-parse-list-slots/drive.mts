// Runs bench.mjs once per measurement, each in a fresh Node process, over the
// validation corpora: `rounds` rounds in alternating variant order, a run
// counting when every variant's spread over the rounds is within `max-spread`
// percent, rerun up to twice more otherwise. Then the retained memory of
// variants a, t and b. Writes parse-cost.json and parse-cost.md to --out.
//
//   pnpm exec tsx docs/superpowers/probes/2026-10-23-parse-list-slots/drive.mts --out /tmp/parse-cost

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus, totalmem } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { loadCorpusEntries } from '../../../../packages/tools/src/validate/common.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const { values } = parseArgs({
	options: {
		out: { type: 'string' },
		grammars: { type: 'string', default: 'rust,typescript,python' },
		rounds: { type: 'string', default: '5' },
		passes: { type: 'string', default: '100' },
		warmup: { type: 'string', default: '10' },
		copies: { type: 'string', default: '5' },
		'max-spread': { type: 'string', default: '4' },
		attempts: { type: 'string', default: '3' }
	}
});
if (values.out === undefined) throw new Error('--out is required');
const out = values.out;
mkdirSync(out, { recursive: true });

const GRAMMARS = values.grammars.split(',');
const VARIANTS = ['a', 't', 'b', 'c', 'd'] as const;
const MEMORY_VARIANTS = ['a', 't', 'b'] as const;
const LABEL: Record<string, string> = {
	a: '(a) parse',
	t: 'parse, then the trivia table alone',
	b: '(b) parse, then node_slots for every routed node',
	c: '(c) parse, then a full read',
	d: '(d) parse, then (b)\'s walk, then a full read'
};
const ROUNDS = Number(values.rounds);
const MAX_SPREAD = Number(values['max-spread']);

type Counts = { trees: number; nodes: number; routed: number; withLists: number; lists: number; runs: number; readRefused: number };
type Timed = { ms: number; min: number; max: number; counts: Counts };
type Memory = { trees: number; live: number; rss: number; heap: number; external: number };

const corpus = Object.fromEntries(
	GRAMMARS.map((grammar) => {
		const path = join(out, `corpus-${grammar}.json`);
		writeFileSync(path, JSON.stringify(loadCorpusEntries(grammar).map((entry) => entry.source)));
		return [grammar, path];
	})
);

const bench = (grammar: string, variant: string, memory: boolean): unknown => {
	const args = ['--expose-gc', join(HERE, 'bench.mjs'), '--grammar', grammar, '--variant', variant, '--corpus', corpus[grammar]!, '--passes', values.passes, '--warmup', values.warmup, '--copies', values.copies];
	const run = spawnSync(process.execPath, memory ? [...args, '--memory'] : args, { encoding: 'utf8', maxBuffer: 1 << 24 });
	if (run.status !== 0) throw new Error(`bench ${grammar} ${variant}${memory ? ' memory' : ''} failed:\n${run.stderr}`);
	return JSON.parse(run.stdout.trim().split('\n').at(-1)!);
};

const median = (xs: number[]): number => {
	const sorted = [...xs].sort((x, y) => x - y);
	const mid = sorted.length >> 1;
	return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
};
const spreadOf = (xs: number[]): number => ((Math.max(...xs) - Math.min(...xs)) / median(xs)) * 100;
const orderOf = <T,>(variants: readonly T[], round: number): T[] => (round % 2 === 0 ? [...variants] : [...variants].reverse());

type Attempt = { rounds: Record<string, Record<string, Timed[]>>; ms: Record<string, Record<string, number>>; spread: Record<string, Record<string, number>>; counts: Record<string, Record<string, Counts>>; meets: boolean };

const attempt = (): Attempt => {
	const rounds: Attempt['rounds'] = Object.fromEntries(GRAMMARS.map((grammar) => [grammar, Object.fromEntries(VARIANTS.map((variant) => [variant, [] as Timed[]]))]));
	for (let round = 0; round < ROUNDS; round += 1) {
		for (const grammar of GRAMMARS) {
			for (const variant of orderOf(VARIANTS, round)) rounds[grammar]![variant]!.push(bench(grammar, variant, false) as Timed);
		}
	}
	const per = <R,>(f: (timed: Timed[]) => R) => Object.fromEntries(GRAMMARS.map((grammar) => [grammar, Object.fromEntries(VARIANTS.map((variant) => [variant, f(rounds[grammar]![variant]!)]))]));
	const ms = per((timed) => median(timed.map((t) => t.ms)));
	const spread = per((timed) => spreadOf(timed.map((t) => t.ms)));
	const counts = per((timed) => timed[0]!.counts);
	const meets = GRAMMARS.every((grammar) => VARIANTS.every((variant) => spread[grammar]![variant]! <= MAX_SPREAD));
	return { rounds, ms, spread, counts, meets };
};

const attempts: Attempt[] = [];
for (let at = 0; at < Number(values.attempts); at += 1) {
	attempts.push(attempt());
	if (attempts.at(-1)!.meets) break;
}
const counted = attempts.at(-1)!;

const memoryRounds: Record<string, Record<string, Memory[]>> = Object.fromEntries(GRAMMARS.map((grammar) => [grammar, Object.fromEntries(MEMORY_VARIANTS.map((variant) => [variant, [] as Memory[]]))]));
for (let round = 0; round < ROUNDS; round += 1) {
	for (const grammar of GRAMMARS) {
		for (const variant of orderOf(MEMORY_VARIANTS, round)) memoryRounds[grammar]![variant]!.push((bench(grammar, variant, true) as { memory: Memory }).memory);
	}
}
const per100 = (bytes: number, trees: number): number => (bytes / trees) * 100;
const memory = Object.fromEntries(
	GRAMMARS.map((grammar) => [
		grammar,
		Object.fromEntries(
			MEMORY_VARIANTS.map((variant) => {
				const runs = memoryRounds[grammar]![variant]!;
				const trees = runs[0]!.trees;
				return [variant, { trees, live: runs[0]!.live, rssPer100: median(runs.map((r) => per100(r.rss, r.trees))), heapPer100: median(runs.map((r) => per100(r.heap, r.trees))), externalPer100: median(runs.map((r) => per100(r.external, r.trees))) }];
			})
		)
	])
);

const machine = { node: process.version, cpus: cpus().length, model: cpus()[0]?.model, memory: totalmem(), platform: `${process.platform}-${process.arch}` };
const settings = { rounds: ROUNDS, passes: Number(values.passes), warmup: Number(values.warmup), copies: Number(values.copies), maxSpread: MAX_SPREAD };
writeFileSync(join(out, 'parse-cost.json'), `${JSON.stringify({ machine, settings, attempts, counted: attempts.length - 1, memory, memoryRounds }, null, '\t')}\n`);

const fixed = (n: number, digits = 2): string => n.toFixed(digits);
const pct = (from: number, to: number): string => `${to >= from ? '+' : ''}${fixed(((to - from) / from) * 100, 1)}%`;
const mib = (bytes: number): string => fixed(bytes / (1 << 20), 2);
const lines: string[] = [];
lines.push(`Node ${machine.node}, ${machine.platform}, ${machine.cpus}× ${machine.model}. ${ROUNDS} rounds in alternating variant order, a fresh process per measurement; each measurement is the median of ${settings.passes} timed passes after ${settings.warmup} warm-up passes, a pass parsing every corpus entry once and disposing its tree.`, '');
lines.push(`Stop rule: every variant's spread (max − min over the rounds, against their median) ≤ ${MAX_SPREAD}%. Attempts: ${attempts.length}; the counted run ${counted.meets ? 'meets' : 'does NOT meet'} the rule.`, '');
lines.push('### ms per pass (median of rounds; spread)', '');
lines.push(`| grammar | ${VARIANTS.map((variant) => LABEL[variant]).join(' | ')} |`, `| --- | ${VARIANTS.map(() => '---').join(' | ')} |`);
for (const grammar of GRAMMARS) lines.push(`| ${grammar} | ${VARIANTS.map((variant) => `${fixed(counted.ms[grammar]![variant]!)} (${fixed(counted.spread[grammar]![variant]!, 1)}%)`).join(' | ')} |`);
lines.push('', '### Change', '', '| grammar | (b) over (a) | (d) over (c) | trivia table alone over (a) |', '| --- | --- | --- | --- |');
for (const grammar of GRAMMARS) {
	const ms = counted.ms[grammar]!;
	lines.push(`| ${grammar} | ${pct(ms.a!, ms.b!)} | ${pct(ms.c!, ms.d!)} | ${pct(ms.a!, ms.t!)} |`);
}
lines.push('', '### What a pass covers', '', '| grammar | trees | nodes | routed nodes | nodes with a list slot | list slots | trivia runs | full reads refused |', '| --- | --- | --- | --- | --- | --- | --- | --- |');
for (const grammar of GRAMMARS) {
	const { b, t, c } = counted.counts[grammar]!;
	lines.push(`| ${grammar} | ${b!.trees} | ${b!.nodes} | ${b!.routed} | ${b!.withLists} | ${b!.lists} | ${t!.runs} | ${c!.readRefused} |`);
}
lines.push('', `### Retained memory per 100 trees (MiB; ${settings.copies} copies of the corpus held, after GC; median of rounds)`, '', '| grammar | trees held | variant | RSS | JS heap | external |', '| --- | --- | --- | --- | --- | --- |');
for (const grammar of GRAMMARS) {
	for (const variant of MEMORY_VARIANTS) {
		const m = memory[grammar]![variant]!;
		lines.push(`| ${grammar} | ${m.live} | ${LABEL[variant]} | ${mib(m.rssPer100)} | ${mib(m.heapPer100)} | ${mib(m.externalPer100)} |`);
	}
}
lines.push('', '### Spread per attempt (%)', '', `| attempt | grammar | ${VARIANTS.join(' | ')} | meets |`, `| --- | --- | ${VARIANTS.map(() => '---').join(' | ')} | --- |`);
attempts.forEach((run, at) => {
	for (const grammar of GRAMMARS) lines.push(`| ${at + 1} | ${grammar} | ${VARIANTS.map((variant) => fixed(run.spread[grammar]![variant]!, 1)).join(' | ')} | ${run.meets ? 'yes' : 'no'} |`);
});
writeFileSync(join(out, 'parse-cost.md'), `${lines.join('\n')}\n`);
process.stdout.write(`${lines.join('\n')}\n`);
