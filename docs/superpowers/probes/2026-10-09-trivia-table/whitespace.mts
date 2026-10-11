/**
 * Measures: what a parsed tree's trivia table stores when whitespace is layout only. A seam's
 * source layout is stored where it differs from the seam's default; spaces within a line derive
 * from the defaults.
 *
 * For each source, the gaps between its tokens are compared with those of its default render: the
 * source's snapshot with every `span` removed, so every gap renders with its seam default. Both
 * texts are parsed with the grammar's wasm parser and their token walks (`walk.mts`: leaves and the
 * text a hidden token leaves between two children; an extra or an `ERROR` is an entry, never a
 * token) lined up one to one. A zero-width node
 * (typescript's automatic semicolon, a default render's line break may add one) has no whitespace of
 * its own, so the walk passes it and the runs either side of it are one gap. A
 * default render whose tokens differ from the source's is counted and left out. Each gap's
 * whitespace (the runs around any comments in it) is classed against the default's:
 *   (a) the source breaks where the default does not;
 *   (b) the default breaks where the source does not;
 *   (c) both break, with a different count of blank lines;
 *   (d) both break alike, with a different indentation;
 *   (e) neither breaks, and the in-line run differs.
 * Classes (a)-(d) are stored, one layout entry each; (e) is derived.
 *
 * Sources: every corpus entry of the five grammars, and the shared-arena inputs
 * (`docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/`).
 * Run (from the root of a checkout with its natives built):
 *   SITTIR_BACKEND=native ./node_modules/.bin/tsx docs/superpowers/probes/2026-10-09-trivia-table/whitespace.mts [out.json]
 * Prints: per source set, the gaps of each class, entries and entry bytes stored under the rule and
 *   with every whitespace run stored, and the empty gaps under each; and the same with the source's
 *   line layout stored (every run that holds a break, whatever its default), as a parsed tree's
 *   table stores it. Writes examples to out.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { walk, type Walk } from './walk.mts';

const ROOT = `${process.cwd()}/`;
const { loadCorpusEntries, loadWebTreeSitter } = await import(`${ROOT}packages/tools/src/validate/common.ts`);
const { languageByName } = await import(`${ROOT}packages/tools/src/languages.ts`);
const { createEngine, snapshotOf } = await import(`${ROOT}packages/common/src/index.ts`);

type Gap = { comments: string[]; runs: string[] };
const CLASSES = ['a', 'b', 'c', 'd', 'e'] as const;
type Class = (typeof CLASSES)[number];

const INPUTS = `${ROOT}docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs`;
const ARENA: [string, string][] = [
	['rust', `${INPUTS}/engine.rs`],
	['rust', `${INPUTS}/spacing.rs`],
	['typescript', `${INPUTS}/create-engine.ts`]
];

/** Each gap between tokens: the comments (extras) in it, and the whitespace runs around them. */
function gaps(source: string, walk: Walk): Gap[] {
	const out: Gap[] = [];
	let extra = 0;
	const gap = (from: number, to: number): Gap => {
		const comments: string[] = [];
		const runs: string[] = [];
		let at = from;
		while (extra < walk.entries.length && walk.entries[extra]!.start < to) {
			const { start, end } = walk.entries[extra++]!;
			runs.push(source.slice(at, start));
			comments.push(source.slice(start, end));
			at = end;
		}
		runs.push(source.slice(at, to));
		return { comments, runs };
	};
	let at = 0;
	for (const token of walk.tokens) {
		out.push(gap(at, token.start));
		at = token.end;
	}
	out.push(gap(at, source.length));
	return out;
}

const breaks = (run: string): number => run.split('\n').length - 1;
const indent = (run: string): string => run.slice(run.lastIndexOf('\n') + 1);

function classOf(source: string, fallback: string): Class | undefined {
	const [s, d] = [breaks(source), breaks(fallback)];
	if (s > 0 && d === 0) return 'a';
	if (s === 0 && d > 0) return 'b';
	if (s > 0 && s !== d) return 'c';
	if (s > 0) return indent(source) === indent(fallback) ? undefined : 'd';
	return source === fallback ? undefined : 'e';
}

function stripSpans(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(stripSpans);
	if (value === null || typeof value !== 'object') return value;
	return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'span').map(([key, inner]) => [key, stripSpans(inner)]));
}

interface Tally {
	sources: number;
	unaligned: number;
	failed: number;
	gaps: number;
	commentMoved: number;
	classes: Record<Class, number>;
	ruleEntries: number;
	ruleBytes: number;
	allEntries: number;
	allBytes: number;
	ruleEmpty: number;
	allEmpty: number;
	lineEntries: number;
	lineBytes: number;
	lineEmpty: number;
}
const tally = (): Tally => ({
	sources: 0,
	unaligned: 0,
	failed: 0,
	gaps: 0,
	commentMoved: 0,
	classes: { a: 0, b: 0, c: 0, d: 0, e: 0 },
	ruleEntries: 0,
	ruleBytes: 0,
	allEntries: 0,
	allBytes: 0,
	ruleEmpty: 0,
	allEmpty: 0,
	lineEntries: 0,
	lineBytes: 0,
	lineEmpty: 0
});
const unaligned: { set: string; entry: string; at: number }[] = [];
const moved: { set: string; entry: string; source: Gap; fallback: Gap; around: string }[] = [];
const examples: Record<string, Record<Class, { entry: string; source: string; fallback: string; around: string }[]>> = {};

const { Parser, Language } = await loadWebTreeSitter();
const engines = new Map<string, any>();
const parsers = new Map<string, any>();
async function setup(grammar: string): Promise<void> {
	if (engines.has(grammar)) return;
	engines.set(grammar, await createEngine(await languageByName(grammar)));
	const parser = new Parser();
	parser.setLanguage(await Language.load(`${ROOT}packages/${grammar}/.sittir/parser.wasm`));
	parsers.set(grammar, parser);
}

async function measure(set: string, grammar: string, name: string, source: string, into: Tally): Promise<void> {
	await setup(grammar);
	const engine = engines.get(grammar);
	const parser = parsers.get(grammar);
	into.sources++;
	let fallback: string;
	try {
		fallback = engine.render(stripSpans(JSON.parse(JSON.stringify(snapshotOf(engine.parse(source, { deep: true, depth: Infinity })))))).toString();
	} catch {
		into.failed++;
		return;
	}
	const [srcWalk, defWalk] = [source, fallback].map((text) => walk(parser.parse(text).rootNode, text, false));
	const [src, def] = [srcWalk!.tokens, defWalk!.tokens];
	if (src.length !== def.length || src.some((token, i) => token.text !== def[i]!.text)) {
		into.unaligned++;
		unaligned.push({ set, entry: name, at: src.findIndex((token, i) => token.text !== def[i]?.text) });
		return;
	}
	const [sg, dg] = [gaps(source, srcWalk!), gaps(fallback, defWalk!)];
	examples[set] ??= { a: [], b: [], c: [], d: [], e: [] };
	for (let i = 0; i < sg.length; i++) {
		const [s, d] = [sg[i]!, dg[i]!];
		into.gaps++;
		const stored = s.runs.filter((run) => run !== '');
		into.allEntries += stored.length;
		into.allBytes += stored.reduce((n, run) => n + run.length, 0);
		if (stored.length === 0) into.allEmpty++;
		const lines = s.runs.filter((run) => run.includes('\n'));
		into.lineEntries += lines.length;
		into.lineBytes += lines.reduce((n, run) => n + run.length, 0);
		if (lines.length === 0) into.lineEmpty++;
		if (s.comments.join('\u0000') !== d.comments.join('\u0000')) {
			into.commentMoved++;
			moved.push({ set, entry: name, source: s, fallback: d, around: `${src[i - 1]?.text ?? '<start>'} | ${src[i]?.text ?? '<end>'}` });
			continue;
		}
		let held = 0;
		s.runs.forEach((run, k) => {
			const found = classOf(run, d.runs[k]!);
			if (found === undefined) return;
			into.classes[found]++;
			if (found !== 'e') {
				held++;
				into.ruleBytes += run.length;
				const kept = examples[set]![found];
				if (kept.length < 3) {
					const before = src[i - 1]?.text ?? '<start>';
					const after = src[i]?.text ?? '<end>';
					kept.push({ entry: name, source: run, fallback: d.runs[k]!, around: `${before} | ${after}` });
				}
			} else if (examples[set]!.e.length < 3) {
				examples[set]!.e.push({ entry: name, source: run, fallback: d.runs[k]!, around: `${src[i - 1]?.text ?? '<start>'} | ${src[i]?.text ?? '<end>'}` });
			}
		});
		into.ruleEntries += held;
		if (held === 0) into.ruleEmpty++;
	}
}

const results: Record<string, Tally> = {};
for (const grammar of ['rust', 'typescript', 'python', 'scm', 'regex']) {
	const into = (results[grammar] = tally());
	for (const { name, source } of loadCorpusEntries(grammar)) await measure(grammar, grammar, name, source, into);
}
for (const [grammar, path] of ARENA) {
	const set = `arena:${path.slice(path.lastIndexOf('/') + 1)}`;
	await measure(set, grammar, set, readFileSync(path, 'utf8'), (results[set] = tally()));
}

const pad = (value: unknown, n: number): string => String(value).padStart(n);
console.log(`${'set'.padEnd(22)} ${pad('srcs', 5)} ${pad('unal', 5)} ${pad('fail', 5)} ${pad('gaps', 7)} ${CLASSES.map((c) => pad(`(${c})`, 6)).join(' ')} ${pad('moved', 6)} | ${pad('rule ent', 9)} ${pad('bytes', 7)} ${pad('empty', 7)} | ${pad('all ent', 8)} ${pad('bytes', 7)} ${pad('empty', 7)} | ${pad('line ent', 8)} ${pad('bytes', 7)} ${pad('empty', 7)}`);
for (const [set, t] of Object.entries(results)) {
	console.log(
		`${set.padEnd(22)} ${pad(t.sources, 5)} ${pad(t.unaligned, 5)} ${pad(t.failed, 5)} ${pad(t.gaps, 7)} ${CLASSES.map((c) => pad(t.classes[c], 6)).join(' ')} ${pad(t.commentMoved, 6)} | ${pad(t.ruleEntries, 9)} ${pad(t.ruleBytes, 7)} ${pad(t.ruleEmpty, 7)} | ${pad(t.allEntries, 8)} ${pad(t.allBytes, 7)} ${pad(t.allEmpty, 7)} | ${pad(t.lineEntries, 8)} ${pad(t.lineBytes, 7)} ${pad(t.lineEmpty, 7)}`
	);
}
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify({ results, unaligned, moved, examples }, null, '\t'));
