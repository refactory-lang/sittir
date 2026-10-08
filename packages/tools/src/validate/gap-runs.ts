import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { grammarPackage } from '@sittir/codegen/grammars';
import { loadCorpusEntries, loadLanguageForGrammar, loadNodeModel, type CorpusEntry, type TSNode } from './common.ts';

export type Grouping = 'kind' | 'supertype' | 'role';

export const GROUPINGS: readonly Grouping[] = ['kind', 'supertype', 'role'];

export const BLANK_BUCKETS = ['same-line', '0', '1', '2', '3+'] as const;

export type BlankBucket = (typeof BLANK_BUCKETS)[number];

export type Histogram = Readonly<Record<BlankBucket, number>>;

export interface RunSide {
	readonly within: Histogram;
	readonly before: Histogram;
	readonly after: Histogram;
}

export interface ListRunCensus {
	readonly list: string;
	readonly pairs: number;
	readonly commented: number;
	readonly overall: Readonly<Record<Grouping, { readonly within: Histogram; readonly boundary: Histogram }>>;
	readonly byGroup: Readonly<Record<Grouping, Readonly<Record<string, RunSide>>>>;
}

export interface RunCensus {
	readonly grammar: string;
	readonly entries: number;
	readonly unparsed: number;
	readonly lists: readonly ListRunCensus[];
}

const emptyHistogram = (): Record<BlankBucket, number> => ({ 'same-line': 0, '0': 0, '1': 0, '2': 0, '3+': 0 });

export function blankBucketOf(gap: string): BlankBucket {
	const breaks = gap.split('\n').length - 1;
	if (breaks === 0) return 'same-line';
	const blank = breaks - 1;
	return blank >= 3 ? '3+' : (String(blank) as BlankBucket);
}

const SIMPLE_BINDING = /^\((\w+)\)\s+@([a-z_][\w.]*)\s*$/;

export function rolesOfBindings(text: string): Map<string, string> {
	const roles = new Map<string, string>();
	for (const line of text.split('\n')) {
		const match = SIMPLE_BINDING.exec(line.trim());
		if (match !== null && !roles.has(match[1]!)) roles.set(match[1]!, match[2]!.split('.')[0]!);
	}
	return roles;
}

export function supertypeOfKinds(subtypes: Readonly<Record<string, readonly string[]>>): Map<string, string> {
	const owner = new Map<string, string>();
	const widthOf = new Map<string, number>();
	for (const [supertype, kinds] of Object.entries(subtypes)) {
		for (const kind of kinds) {
			if ((widthOf.get(kind) ?? Infinity) > kinds.length) {
				owner.set(kind, supertype);
				widthOf.set(kind, kinds.length);
			}
		}
	}
	return owner;
}

const STATEMENT_FIELD = 'statements';

interface Pair {
	readonly list: string;
	readonly gap: string;
	readonly left: string;
	readonly right: string;
}

export function statementPairs(root: TSNode, source: string): { pairs: Pair[]; commented: Map<string, number> } {
	const pairs: Pair[] = [];
	const commented = new Map<string, number>();
	const visit = (node: TSNode): void => {
		const items: TSNode[] = [];
		const between: number[] = [];
		node.children.forEach((child, index) => {
			if (node.fieldNameForChild(index) === STATEMENT_FIELD && child.isNamed && !child.isExtra) {
				items.push(child);
				between.push(index);
			}
		});
		for (let at = 0; at + 1 < items.length; at++) {
			const [left, right] = [items[at]!, items[at + 1]!];
			const gap = source.slice(left.endIndex, right.startIndex);
			if (/\S/.test(gap)) commented.set(node.type, (commented.get(node.type) ?? 0) + 1);
			else pairs.push({ list: node.type, gap, left: left.type, right: right.type });
		}
		for (const child of node.children) visit(child);
	};
	visit(root);
	return { pairs, commented };
}

type MutableSide = { within: Record<BlankBucket, number>; before: Record<BlankBucket, number>; after: Record<BlankBucket, number> };

export async function computeRunCensus(grammar: string, sources?: readonly CorpusEntry[]): Promise<RunCensus> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	const entries = sources ?? loadCorpusEntries(grammar);
	const model = await loadNodeModel(grammar);
	const supertype = supertypeOfKinds(model.subtypes);
	const roles = rolesOfBindings(readFileSync(join(grammarPackage(grammar).dir, 'bindings.scm'), 'utf-8'));
	const groupOf: Record<Grouping, (kind: string) => string> = {
		kind: (kind) => kind,
		supertype: (kind) => supertype.get(kind) ?? '(none)',
		role: (kind) => roles.get(kind) ?? '(unbound)'
	};
	const lists = new Map<string, { pairs: number; commented: number; overall: Record<Grouping, { within: Record<BlankBucket, number>; boundary: Record<BlankBucket, number> }>; byGroup: Record<Grouping, Map<string, MutableSide>> }>();
	const listOf = (name: string) => {
		let list = lists.get(name);
		if (list === undefined) {
			list = { pairs: 0, commented: 0, overall: { kind: { within: emptyHistogram(), boundary: emptyHistogram() }, supertype: { within: emptyHistogram(), boundary: emptyHistogram() }, role: { within: emptyHistogram(), boundary: emptyHistogram() } }, byGroup: { kind: new Map(), supertype: new Map(), role: new Map() } };
			lists.set(name, list);
		}
		return list;
	};
	const sideOf = (list: ReturnType<typeof listOf>, grouping: Grouping, key: string): MutableSide => {
		let side = list.byGroup[grouping].get(key);
		if (side === undefined) {
			side = { within: emptyHistogram(), before: emptyHistogram(), after: emptyHistogram() };
			list.byGroup[grouping].set(key, side);
		}
		return side;
	};
	let unparsed = 0;
	for (const entry of entries) {
		const parsed = parser.parse(entry.source);
		if (parsed === null || parsed.rootNode.hasError) {
			unparsed += 1;
			continue;
		}
		const { pairs, commented } = statementPairs(parsed.rootNode, entry.source);
		for (const [name, count] of commented) listOf(name).commented += count;
		for (const pair of pairs) {
			const list = listOf(pair.list);
			const bucket = blankBucketOf(pair.gap);
			list.pairs += 1;
			for (const grouping of GROUPINGS) {
				const [left, right] = [groupOf[grouping](pair.left), groupOf[grouping](pair.right)];
				if (left === right) {
					list.overall[grouping].within[bucket] += 1;
					sideOf(list, grouping, left).within[bucket] += 1;
				} else {
					list.overall[grouping].boundary[bucket] += 1;
					sideOf(list, grouping, left).after[bucket] += 1;
					sideOf(list, grouping, right).before[bucket] += 1;
				}
			}
		}
	}
	return {
		grammar,
		entries: entries.length,
		unparsed,
		lists: [...lists]
			.sort((a, b) => b[1].pairs - a[1].pairs)
			.map(([list, data]) => ({
				list,
				pairs: data.pairs,
				commented: data.commented,
				overall: data.overall,
				byGroup: Object.fromEntries(GROUPINGS.map((grouping) => [grouping, Object.fromEntries(data.byGroup[grouping])])) as ListRunCensus['byGroup']
			}))
	};
}

const histogramLine = (histogram: Histogram): string => BLANK_BUCKETS.map((bucket) => `${bucket}:${histogram[bucket]}`).join(' ');

export function renderRunCensus(census: RunCensus, top: number): string[] {
	const out = [`# ${census.grammar}: entries ${census.entries}, unparsed ${census.unparsed}`];
	for (const list of census.lists) {
		out.push(`## ${census.grammar} ${list.list}: ${list.pairs} pairs, ${list.commented} held a comment`);
		for (const grouping of GROUPINGS) {
			const groups = Object.entries(list.byGroup[grouping]);
			const weight = ([, side]: [string, RunSide]): number =>
				BLANK_BUCKETS.reduce((total, bucket) => total + side.within[bucket] + side.before[bucket] + side.after[bucket], 0);
			groups.sort((a, b) => weight(b) - weight(a));
			out.push(`  by ${grouping}: within-run ${histogramLine(list.overall[grouping].within)} | boundary ${histogramLine(list.overall[grouping].boundary)}`);
			out.push(`  by ${grouping} (top ${top} of ${groups.length}):`);
			for (const [key, side] of groups.slice(0, top)) {
				out.push(`    ${key}: within ${histogramLine(side.within)} | before ${histogramLine(side.before)} | after ${histogramLine(side.after)}`);
			}
		}
	}
	return out;
}
