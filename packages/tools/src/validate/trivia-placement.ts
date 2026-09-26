import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertGrammar, stableGrammars } from '@sittir/codegen/grammars';
import { loadCorpusEntries, loadLanguageForGrammar, type TSNode, type TSTree } from './common.ts';

export type PlacementRule = 1 | 2 | 3 | 4;
export type TodayPlacement = 'leading' | 'trailing' | 'lost';
export type InnerGap = 'slot' | 'interior' | 'unkeyable';

export interface TriviaPlacementRow {
	readonly entry: string;
	readonly kind: string;
	readonly parent: string;
	readonly prevNamed: string | undefined;
	readonly nextNamed: string | undefined;
	readonly sameRowAsPrev: boolean;
	readonly rule: PlacementRule;
	readonly today: TodayPlacement;
	readonly gap: InnerGap | undefined;
	readonly outsideBlock: boolean;
}

export interface TriviaPlacementSummary {
	readonly grammar: string;
	readonly entries: number;
	readonly extras: number;
	readonly byRule: Readonly<Record<PlacementRule, number>>;
	readonly lostToday: number;
	readonly movedToTrailing: number;
	readonly innerByGap: Readonly<Record<InnerGap, number>>;
	readonly unkeyableKinds: readonly string[];
	readonly unkeyableInCorpus: readonly string[];
	readonly outsideBlock: number;
}

export interface TriviaPlacementCensus {
	readonly summary: TriviaPlacementSummary;
	readonly rows: readonly TriviaPlacementRow[];
}

interface GapModel {
	readonly gapOf: (parent: TSNode) => InnerGap;
	readonly unkeyableKinds: readonly string[];
}

interface GrammarJsonRule {
	readonly type: string;
	readonly members?: readonly GrammarJsonRule[];
	readonly content?: GrammarJsonRule;
}

function grammarJsonRules(grammar: string): Readonly<Record<string, GrammarJsonRule>> {
	const packagesDir = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
	const path = resolve(packagesDir, grammar, '.sittir', 'src', 'grammar.json');
	return (JSON.parse(readFileSync(path, 'utf8')) as { rules: Record<string, GrammarJsonRule> }).rules;
}

function slotlessTokens(rule: GrammarJsonRule): number | undefined {
	const sum = (counts: readonly (number | undefined)[]): number | undefined =>
		counts.includes(undefined) ? undefined : (counts as number[]).reduce((a, b) => a + b, 0);
	switch (rule.type) {
		case 'SYMBOL':
			return undefined;
		case 'BLANK':
			return 0;
		case 'STRING':
		case 'PATTERN':
		case 'TOKEN':
		case 'IMMEDIATE_TOKEN':
			return 1;
		case 'SEQ':
			return sum((rule.members ?? []).map(slotlessTokens));
		case 'CHOICE': {
			const counts = (rule.members ?? []).map(slotlessTokens);
			return counts.includes(undefined) ? undefined : Math.max(0, ...(counts as number[]));
		}
		case 'REPEAT':
		case 'REPEAT1': {
			const inner = slotlessTokens(rule.content!);
			return inner === undefined ? undefined : inner > 0 ? Number.POSITIVE_INFINITY : 0;
		}
		default:
			return rule.content === undefined ? 1 : slotlessTokens(rule.content);
	}
}

function tokenChildren(node: TSNode): number {
	return node.children.filter((child) => !child.isNamed && !child.isExtra).length;
}

function gapModel(grammar: string): GapModel {
	const rules = grammarJsonRules(grammar);
	const isSlotless = (kind: string): boolean => rules[kind] !== undefined && slotlessTokens(rules[kind]) !== undefined;
	const gapOf = (parent: TSNode): InnerGap => {
		if (!isSlotless(parent.type)) return 'slot';
		return tokenChildren(parent) === 2 ? 'interior' : 'unkeyable';
	};
	const unkeyableKinds = Object.entries(rules)
		.filter(([kind, rule]) => !kind.startsWith('_') && (slotlessTokens(rule) ?? 0) > 2)
		.map(([kind]) => kind)
		.sort();
	return { gapOf, unkeyableKinds };
}

function isOwner(node: TSNode): boolean {
	return node.isNamed && !node.isExtra;
}

function lastOwner(node: TSNode): TSNode | undefined {
	return node.children.filter(isOwner).at(-1);
}

function enclosedBlockColumn(prev: TSNode, blockKind: string): number | undefined {
	let column: number | undefined;
	for (let at: TSNode | undefined = prev; at !== undefined; at = lastOwner(at)) {
		if (at.type === blockKind) column = at.children.find(isOwner)?.startPosition.column;
	}
	return column;
}

function placementRows(
	entry: string,
	root: TSNode,
	gapOf: (parent: TSNode) => InnerGap,
	blockKind: string | undefined
): TriviaPlacementRow[] {
	const rows: TriviaPlacementRow[] = [];
	const visit = (parent: TSNode): void => {
		const children = parent.children;
		children.forEach((child, index) => {
			if (!child.isExtra) {
				visit(child);
				return;
			}
			const prev = children.slice(0, index).filter(isOwner).at(-1);
			const next = children.slice(index + 1).find(isOwner);
			const sameRowAsPrev = prev !== undefined && child.startPosition.row === prev.endPosition.row;
			const rule: PlacementRule = sameRowAsPrev ? 1 : next !== undefined ? 2 : prev !== undefined ? 3 : 4;
			const blockColumn =
				prev === undefined || blockKind === undefined ? undefined : enclosedBlockColumn(prev, blockKind);
			rows.push({
				entry,
				kind: child.type,
				parent: parent.type,
				prevNamed: prev?.type,
				nextNamed: next?.type,
				sameRowAsPrev,
				rule,
				today: next !== undefined ? 'leading' : prev !== undefined ? 'trailing' : 'lost',
				gap: rule === 4 ? gapOf(parent) : undefined,
				outsideBlock: !sameRowAsPrev && blockColumn !== undefined && child.startPosition.column >= blockColumn
			});
		});
	};
	visit(root);
	return rows;
}

async function parserFor(grammar: string): Promise<(source: string) => TSTree> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	return (source) => parser.parse(source) as TSTree;
}

function blockKindOf(grammar: string): string | undefined {
	return grammar === 'python' ? 'block' : undefined;
}

export interface TriviaPlacementSourceOptions {
	readonly grammar: string;
	readonly source: string;
}

export async function runTriviaPlacement(opts: TriviaPlacementSourceOptions): Promise<TriviaPlacementRow[]> {
	const grammar = assertGrammar(opts.grammar);
	const parse = await parserFor(grammar);
	return placementRows('<source>', parse(opts.source).rootNode, gapModel(grammar).gapOf, blockKindOf(grammar));
}

export async function computeTriviaPlacementCensus(grammar: string): Promise<TriviaPlacementCensus> {
	const parse = await parserFor(grammar);
	const { gapOf, unkeyableKinds } = gapModel(grammar);
	const entries = loadCorpusEntries(grammar);
	const rows: TriviaPlacementRow[] = [];
	for (const entry of entries) {
		const tree = parse(entry.source);
		if (tree.rootNode.hasError) continue;
		rows.push(...placementRows(entry.name, tree.rootNode, gapOf, blockKindOf(grammar)));
	}
	const count = (keep: (row: TriviaPlacementRow) => boolean): number => rows.filter(keep).length;
	const inner = rows.filter((row) => row.rule === 4);
	return {
		rows,
		summary: {
			grammar,
			entries: entries.length,
			extras: rows.length,
			byRule: {
				1: count((r) => r.rule === 1),
				2: count((r) => r.rule === 2),
				3: count((r) => r.rule === 3),
				4: inner.length
			},
			lostToday: count((r) => r.today === 'lost'),
			movedToTrailing: count((r) => r.rule === 1 && r.today === 'leading'),
			innerByGap: {
				slot: count((r) => r.gap === 'slot'),
				interior: count((r) => r.gap === 'interior'),
				unkeyable: count((r) => r.gap === 'unkeyable')
			},
			unkeyableKinds,
			unkeyableInCorpus: [...new Set(inner.filter((r) => r.gap === 'unkeyable').map((r) => r.parent))].sort(),
			outsideBlock: count((r) => r.outsideBlock)
		}
	};
}

export interface TriviaPlacementOptions {
	readonly grammar: string;
	readonly allGrammars: boolean;
	readonly json: boolean;
}

export async function run(opts: TriviaPlacementOptions): Promise<number> {
	const grammars = opts.allGrammars ? stableGrammars() : [assertGrammar(opts.grammar)];
	const censuses: TriviaPlacementCensus[] = [];
	for (const grammar of grammars) censuses.push(await computeTriviaPlacementCensus(grammar));
	if (opts.json) {
		console.log(JSON.stringify(opts.allGrammars ? censuses : censuses[0], null, 2));
		return 0;
	}
	for (const { summary, rows } of censuses) {
		for (const row of rows) {
			console.log(
				[
					row.entry,
					row.kind,
					row.parent,
					row.prevNamed ?? '-',
					row.nextNamed ?? '-',
					row.sameRowAsPrev,
					row.rule,
					row.today,
					row.gap ?? '-'
				].join('\t')
			);
		}
		console.log(`# ${summary.grammar}: ${JSON.stringify(summary)}`);
	}
	return 0;
}
