import { assertGrammar, stableGrammars } from '@sittir/codegen/grammars';
import { readFileSync } from 'node:fs';
import { sourceSpans, spanSlicer } from '@sittir/common';
import { computeRunCensus, renderRunCensus } from './gap-runs.ts';
import { gapClassOf, type GapClass } from '../exercise/default-diff.ts';
import { loadCorpusEntries, type CorpusEntry, loadKindNameFromId, loadLanguageForGrammar, loadNativeEngine, type TSNode } from './common.ts';

export type LossyShape =
	| 'crlf'
	| 'tabs'
	| 'trailing-before-break'
	| 'multi-space'
	| 'wide-break-run'
	| 'break-lost'
	| 'tight-lost'
	| 'indent-after-break'
	| 'other';

export const LOSSY_SHAPES: readonly LossyShape[] = [
	'multi-space',
	'tabs',
	'crlf',
	'trailing-before-break',
	'wide-break-run',
	'break-lost',
	'tight-lost',
	'indent-after-break',
	'other'
];

export interface ListGap {
	readonly key: string;
	readonly parent: string;
	readonly field: string;
	readonly separator: string;
	readonly lead: string;
	readonly trail: string;
}

export interface LossyRow {
	readonly entry: string;
	readonly offset: number;
	readonly parent: string;
	readonly field: string;
	readonly separator: string;
	readonly source: { readonly lead: string; readonly trail: string };
	readonly rendered: { readonly lead: string; readonly trail: string };
	readonly arm: { readonly lead: GapClass; readonly trail: GapClass };
	readonly shape: LossyShape;
}

export interface GapCensusSummary {
	readonly grammar: string;
	readonly entries: number;
	readonly unparsed: number;
	readonly unrendered: number;
	readonly gaps: number;
	readonly commented: number;
	readonly uncovered: number;
	readonly unmatched: number;
	readonly rebuildFailed: number;
	readonly locateFailed: number;
	readonly exact: number;
	readonly lossy: number;
	readonly byShape: Readonly<Record<LossyShape, number>>;
}

export interface GapCensus {
	readonly summary: GapCensusSummary;
	readonly lossy: readonly LossyRow[];
	readonly uncoveredBy: Readonly<Record<string, number>>;
}

const breaksOf = (text: string): number => text.split('\n').length - 1;

export function lossyShapeOf(
	source: { readonly lead: string; readonly trail: string },
	rendered: { readonly lead: string; readonly trail: string }
): LossyShape {
	const sides: [string, string][] = [
		[source.lead, rendered.lead],
		[source.trail, rendered.trail]
	];
	const differing = sides.filter(([from, to]) => from !== to);
	if (differing.every(([from, to]) => stripIndent(from) === stripIndent(to))) return 'indent-after-break';
	if (differing.some(([from]) => from.includes('\r'))) return 'crlf';
	if (differing.some(([from]) => from.includes('\t'))) return 'tabs';
	if (differing.some(([from]) => /[ \t]\n/.test(from))) return 'trailing-before-break';
	if (differing.some(([from]) => !from.includes('\n') && /  /.test(from))) return 'multi-space';
	if (differing.some(([from, to]) => breaksOf(from) > breaksOf(to) && breaksOf(to) >= 1)) return 'wide-break-run';
	if (differing.some(([from, to]) => breaksOf(from) >= 1 && breaksOf(to) === 0)) return 'break-lost';
	if (differing.some(([from, to]) => from === '' && to !== '')) return 'tight-lost';
	return 'other';
}

function stripIndent(text: string): string {
	const last = text.lastIndexOf('\n');
	return last === -1 ? text : text.slice(0, last + 1);
}

function isSeparatorToken(node: TSNode): boolean {
	return !node.isNamed && !node.isExtra && node.childCount === 0;
}

const WHITESPACE_ONLY = /^\s*$/;

interface GapScan {
	readonly gaps: readonly ListGap[];
	readonly commented: number;
}

export function scanListGaps(root: TSNode, source: string): GapScan {
	const gaps: ListGap[] = [];
	let commented = 0;
	const visit = (node: TSNode): void => {
		const runs = new Map<string, { item: TSNode; index: number }[]>();
		node.children.forEach((child, index) => {
			const field = node.fieldNameForChild(index);
			if (field !== null && child.isNamed && !child.isExtra) {
				const run = runs.get(field) ?? [];
				run.push({ item: child, index });
				runs.set(field, run);
			}
		});
		for (const [field, run] of runs) {
			for (let pair = 0; pair + 1 < run.length; pair++) {
				const [left, right] = [run[pair]!, run[pair + 1]!];
				const between = node.children.slice(left.index + 1, right.index);
				const separators = between.filter(isSeparatorToken);
				if (between.some((child) => !isSeparatorToken(child)) || separators.length > 1) {
					commented += 1;
					continue;
				}
				const text = source.slice(left.item.endIndex, right.item.startIndex);
				const separator = separators[0]?.text ?? '';
				const at = separator === '' ? text.length : text.indexOf(separator);
				const lead = text.slice(0, at);
				const trail = separator === '' ? '' : text.slice(at + separator.length);
				if (!WHITESPACE_ONLY.test(lead) || !WHITESPACE_ONLY.test(trail)) {
					commented += 1;
					continue;
				}
				gaps.push({ key: `${left.item.endIndex}:${right.item.startIndex}`, parent: node.type, field, separator, lead, trail });
			}
		}
		for (const child of node.children) visit(child);
	};
	visit(root);
	return { gaps, commented };
}

function emptyByShape(): Record<LossyShape, number> {
	return Object.fromEntries(LOSSY_SHAPES.map((shape) => [shape, 0])) as Record<LossyShape, number>;
}

interface SpanLike {
	readonly start: number;
	readonly end: number;
}

interface TypedNode {
	readonly $span: SpanLike;
	readonly $type: number;
	readonly $with?: Record<string, ((...items: unknown[]) => { $render(): string }) | undefined>;
}

const isTypedNode = (value: unknown): value is TypedNode =>
	typeof value === 'object' && value !== null && '$span' in value && '$type' in value;

interface RebuiltList {
	readonly owner: string;
	readonly slot: string;
	readonly items: readonly TypedNode[];
	readonly adjacent: readonly boolean[];
	readonly rendered: string;
}

const camelOf = (slot: string): string => slot.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());

const isArrayLike = (value: unknown): value is ArrayLike<unknown> =>
	typeof value === 'object' && value !== null && typeof (value as { length?: unknown }).length === 'number';

const holdsMany = (owner: unknown, value: unknown): value is ArrayLike<unknown> =>
	isArrayLike(value) && (!('$span' in value) || isArrayLike(owner));

function* slotValuesOf(node: TypedNode): Generator<{ camel: string; values: unknown[]; many: boolean }> {
	const record = node as unknown as Record<string, unknown>;
	const names = new Set([
		...Object.getOwnPropertyNames(node)
			.filter((key) => key.startsWith('_') && !key.startsWith('$'))
			.map((key) => camelOf(key.slice(1))),
		...Object.keys(node.$with ?? {})
	]);
	for (const camel of names) {
		const read = record[camel];
		if (typeof read !== 'function') continue;
		let value: unknown;
		try {
			value = read.call(node);
		} catch {
			continue;
		}
		yield holdsMany(node, value) ? { camel, values: Array.from(value), many: true } : { camel, values: [value], many: false };
	}
}

function rebuiltLists(root: TypedNode, kindName: (id: number) => string, rebuildFailures: string[]): RebuiltList[] {
	const lists: RebuiltList[] = [];
	const visit = (node: TypedNode): void => {
		for (const { camel, values, many } of slotValuesOf(node)) {
			const items = values.filter(isTypedNode);
			if (many && items.length >= 2) {
				const rebuild = node.$with?.[camel];
				const adjacent = items.slice(0, -1).map((item, at) => values.indexOf(items[at + 1]) === values.indexOf(item) + 1);
				try {
					if (rebuild !== undefined) {
						lists.push({ owner: kindName(node.$type), slot: camel, items, adjacent, rendered: rebuild.call(node.$with, ...values).$render() });
					}
				} catch (error) {
					rebuildFailures.push(`${kindName(node.$type)}.${camel}: ${String(error).slice(0, 120)}`);
				}
			}
			for (const child of items) visit(child);
		}
	};
	visit(root);
	return lists;
}

export interface EntryMeasure {
	readonly status: 'measured' | 'unparsed' | 'unrendered';
	readonly gaps: number;
	readonly commented: number;
	readonly exact: number;
	readonly unmatched: number;
	readonly lossy: readonly LossyRow[];
	readonly uncovered: readonly string[];
	readonly rebuildFailures: readonly string[];
	readonly locateFailures: number;
}

export type GapMeter = (name: string, source: string) => EntryMeasure;

const UNMEASURED: Omit<EntryMeasure, 'status'> = { gaps: 0, commented: 0, exact: 0, unmatched: 0, lossy: [], uncovered: [], rebuildFailures: [], locateFailures: 0 };

export async function createGapMeter(grammar: string): Promise<GapMeter> {
	const engine = await loadNativeEngine(grammar);
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const nameOf = await loadKindNameFromId(grammar);
	const kindName = (id: number): string => nameOf?.(id) ?? String(id);
	const parser = new Parser();
	parser.setLanguage(lang);
	return (name, source) => {
		const parsed = parser.parse(source);
		if (parsed === null || parsed.rootNode.hasError) return { ...UNMEASURED, status: 'unparsed' };
		const scan = scanListGaps(parsed.rootNode, source);
		const byOffsets = new Map(scan.gaps.map((gap) => [gap.key, gap]));
		const spans = sourceSpans(source);
		const textOf = spanSlicer(source);
		const rebuildFailures: string[] = [];
		let lists: RebuiltList[];
		try {
			lists = rebuiltLists(engine.parse(source) as unknown as TypedNode, kindName, rebuildFailures);
		} catch {
			return { ...UNMEASURED, status: 'unrendered' };
		}
		const seen = new Set<string>();
		const lossy: LossyRow[] = [];
		let [exact, unmatched, locateFailures] = [0, 0, 0];
		for (const list of lists) {
			const text = list.items.map((item) => textOf(item.$span));
			const located = locateItems(list.rendered, text);
			if (located === undefined) {
				locateFailures += 1;
				continue;
			}
			for (let pair = 0; pair + 1 < list.items.length; pair++) {
				const key = `${spans.toIndices(list.items[pair]!.$span).end}:${spans.toIndices(list.items[pair + 1]!.$span).start}`;
				const gap = byOffsets.get(key);
				if (gap === undefined || seen.has(key) || list.adjacent[pair] !== true) continue;
				seen.add(key);
				const outcome = splitAtSeparator(list.rendered.slice(located[pair]![1], located[pair + 1]![0]), gap.separator);
				if (outcome === undefined) {
					unmatched += 1;
					continue;
				}
				const original = { lead: gap.lead, trail: gap.trail };
				if (outcome.lead === original.lead && outcome.trail === original.trail) {
					exact += 1;
					continue;
				}
				lossy.push({
					entry: name,
					offset: Number(key.split(':')[0]),
					parent: `${list.owner}.${list.slot}`,
					field: gap.field,
					separator: gap.separator,
					source: original,
					rendered: outcome,
					arm: { lead: gapClassOf(outcome.lead), trail: gapClassOf(outcome.trail) },
					shape: lossyShapeOf(original, outcome)
				});
			}
		}
		const uncovered = scan.gaps.filter((gap) => !seen.has(gap.key)).map((gap) => `${gap.parent}.${gap.field}`);
		return { status: 'measured', gaps: scan.gaps.length, commented: scan.commented, exact, unmatched, lossy, uncovered, rebuildFailures, locateFailures };
	};
}

const LEAD_CHARS = 12;

function locateItems(rendered: string, texts: readonly string[]): [number, number][] | undefined {
	return locateVerbatim(rendered, texts) ?? locateIgnoringSpace(rendered, texts) ?? locateAnchored(rendered, texts);
}

function locateVerbatim(rendered: string, texts: readonly string[]): [number, number][] | undefined {
	const spans: [number, number][] = [];
	let cursor = 0;
	for (const text of texts) {
		const start = rendered.indexOf(text, cursor);
		if (start === -1) return undefined;
		spans.push([start, start + text.length]);
		cursor = start + text.length;
	}
	return spans;
}

function locateIgnoringSpace(rendered: string, texts: readonly string[]): [number, number][] | undefined {
	const spans: [number, number][] = [];
	let cursor = 0;
	for (const text of texts) {
		const chars = [...text.replace(/\s+/g, '')];
		const head = chars.slice(0, LEAD_CHARS).map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*');
		const start = rendered.slice(cursor).search(new RegExp(head));
		if (start === -1) return undefined;
		let at = cursor + start;
		for (const char of chars) {
			while (/\s/.test(rendered[at] ?? '')) at += 1;
			if (rendered[at] !== char) return undefined;
			at += 1;
		}
		spans.push([cursor + start, at]);
		cursor = at;
	}
	return spans;
}

const spacedPattern = (chars: readonly string[]): RegExp =>
	new RegExp(chars.map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*'), 'g');

function locateAnchored(rendered: string, texts: readonly string[]): [number, number][] | undefined {
	const pieces = texts.map((text) => [...text.replace(/\s+/g, '')]);
	const starts: number[] = [];
	let cursor = 0;
	for (const chars of pieces) {
		const found = rendered.slice(cursor).search(spacedPattern(chars.slice(0, LEAD_CHARS)));
		if (found === -1) return undefined;
		starts.push(cursor + found);
		cursor += found + 1;
	}
	return starts.map((start, index) => {
		const limit = starts[index + 1] ?? rendered.length;
		const tail = spacedPattern(pieces[index]!.slice(-LEAD_CHARS));
		const within = rendered.slice(start, limit);
		let end = start;
		for (const match of within.matchAll(tail)) end = start + match.index + match[0].length;
		return [start, end] as [number, number];
	});
}

function splitAtSeparator(gap: string, separator: string): { lead: string; trail: string } | undefined {
	const at = separator === '' ? gap.length : gap.indexOf(separator);
	if (at === -1) return undefined;
	const [lead, trail] = [gap.slice(0, at), separator === '' ? '' : gap.slice(at + separator.length)];
	return WHITESPACE_ONLY.test(lead) && WHITESPACE_ONLY.test(trail) ? { lead, trail } : undefined;
}

export async function computeGapCensus(grammar: string, sources?: readonly CorpusEntry[]): Promise<GapCensus> {
	const meter = await createGapMeter(grammar);
	const entries = sources ?? loadCorpusEntries(grammar);
	const lossy: LossyRow[] = [];
	const uncoveredBy: Record<string, number> = {};
	const byShape = emptyByShape();
	const total = { unparsed: 0, unrendered: 0, gaps: 0, commented: 0, exact: 0, unmatched: 0, uncovered: 0, rebuildFailed: 0, locateFailed: 0 };
	for (const entry of entries) {
		const measure = meter(entry.name, entry.source);
		if (measure.status !== 'measured') {
			total[measure.status] += 1;
			continue;
		}
		for (const key of ['gaps', 'commented', 'exact', 'unmatched'] as const) total[key] += measure[key];
		total.uncovered += measure.uncovered.length;
		total.rebuildFailed += measure.rebuildFailures.length;
		total.locateFailed += measure.locateFailures;
		for (const name of measure.uncovered) uncoveredBy[name] = (uncoveredBy[name] ?? 0) + 1;
		for (const row of measure.lossy) byShape[row.shape] += 1;
		lossy.push(...measure.lossy);
	}
	return {
		lossy,
		uncoveredBy,
		summary: { grammar, entries: entries.length, ...total, lossy: lossy.length, byShape }
	};
}

export interface GapCensusOptions {
	readonly grammar: string;
	readonly allGrammars: boolean;
	readonly files: readonly string[];
	readonly crlf: boolean;
	readonly runs: boolean;
	readonly top: number;
	readonly examples: number;
	readonly json: boolean;
}

function fileEntry(file: string, crlf: boolean): CorpusEntry {
	const text = readFileSync(file, 'utf-8');
	return { name: file, source: crlf ? text.replace(/\r?\n/g, '\r\n') : text };
}

const escaped = (text: string): string => JSON.stringify(text);

export async function run(opts: GapCensusOptions): Promise<number> {
	const grammars = opts.allGrammars ? stableGrammars() : [assertGrammar(opts.grammar)];
	if (opts.runs) return runRunCensus(opts, grammars);
	const censuses: GapCensus[] = [];
	const sources = opts.files.length === 0 ? undefined : opts.files.map((file) => fileEntry(file, opts.crlf));
	for (const grammar of grammars) censuses.push(await computeGapCensus(grammar, sources));
	if (opts.json) {
		console.log(JSON.stringify(opts.allGrammars ? censuses : censuses[0], null, 2));
		return 0;
	}
	for (const { summary, lossy } of censuses) {
		console.log(`# ${summary.grammar}: ${JSON.stringify({ ...summary, byShape: undefined })}`);
		for (const shape of LOSSY_SHAPES) {
			const rows = lossy.filter((row) => row.shape === shape);
			console.log(`## ${summary.grammar} ${shape}: ${rows.length}`);
			for (const row of rows.slice(0, opts.examples)) {
				console.log(
					`  ${row.entry} | ${row.parent}.${row.field} sep=${escaped(row.separator)} | source ${escaped(row.source.lead)} ${escaped(row.source.trail)} | rendered ${escaped(row.rendered.lead)} ${escaped(row.rendered.trail)} | arm ${row.arm.lead}/${row.arm.trail}`
				);
			}
		}
	}
	return 0;
}

async function runRunCensus(opts: GapCensusOptions, grammars: readonly string[]): Promise<number> {
	const sources = opts.files.length === 0 ? undefined : opts.files.map((file) => fileEntry(file, opts.crlf));
	const censuses = [];
	for (const grammar of grammars) censuses.push(await computeRunCensus(grammar, sources));
	if (opts.json) {
		console.log(JSON.stringify(opts.allGrammars ? censuses : censuses[0], null, 2));
		return 0;
	}
	for (const census of censuses) for (const line of renderRunCensus(census, opts.top)) console.log(line);
	return 0;
}
