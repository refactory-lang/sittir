import { assertGrammar, stableGrammars } from '@sittir/codegen/grammars';
import { isCoordinate, type TreeHandle } from '@sittir/common/utils';
import { loadCorpusEntries, loadLanguageForGrammar, loadNativeEngine, readNativeTree, type TSNode, type TSTree } from './common.ts';

export type TriviaPosition = 'leading' | 'trailing' | 'inner' | 'lost';

export interface TriviaPlacementRow {
	readonly entry: string;
	readonly kind: string;
	readonly start: number;
	readonly end: number;
	readonly owner: string | undefined;
	readonly position: TriviaPosition;
}

export interface TriviaPlacementSummary {
	readonly grammar: string;
	readonly entries: number;
	readonly extras: number;
	readonly leading: number;
	readonly trailing: number;
	readonly inner: number;
	readonly lost: number;
}

export interface TriviaPlacementCensus {
	readonly summary: TriviaPlacementSummary;
	readonly rows: readonly TriviaPlacementRow[];
}

interface Placement {
	readonly owner: string;
	readonly position: Exclude<TriviaPosition, 'lost'>;
}

type PlaceSource = (entry: string, source: string, parsed: TSTree) => TriviaPlacementRow[];

interface PlacementReader {
	readonly parse: (source: string) => TSTree;
	readonly place: PlaceSource;
}

/** Every node of `root` in preorder, the order a descendant index counts. */
function descendants(root: TSNode): TSNode[] {
	const out: TSNode[] = [];
	const visit = (node: TSNode): void => {
		out.push(node);
		for (const child of node.children) visit(child);
	};
	visit(root);
	return out;
}

/**
 * Where the tree's trivia table puts each extra: a coordinate entry by its
 * span, and a layout member (a line continuation), which the table holds as
 * its text, by that text in table order.
 */
function tablePlacements(tree: TreeHandle, nodes: readonly TSNode[]): { readonly bySpan: Map<string, Placement>; readonly byText: Map<string, Placement[]> } {
	const bySpan = new Map<string, Placement>();
	const byText = new Map<string, Placement[]>();
	nodes.forEach((node, index) => {
		for (const position of ['leading', 'trailing', 'inner'] as const) {
			for (const entry of tree.triviaSide?.(index, position) ?? []) {
				const placement = { owner: node.type, position };
				if (isCoordinate(entry)) bySpan.set(`${entry.$span.start}:${entry.$span.end}`, placement);
				else if (typeof entry === 'object' && entry !== null && typeof (entry as { $text?: unknown }).$text === 'string') {
					const text = (entry as { $text: string }).$text;
					byText.set(text, [...(byText.get(text) ?? []), placement]);
				}
			}
		}
	});
	return { bySpan, byText };
}

function parsedExtras(node: TSNode): TSNode[] {
	return node.isExtra ? [node] : node.children.flatMap(parsedExtras);
}

async function placementReader(grammar: string): Promise<PlacementReader> {
	const engine = await loadNativeEngine(grammar);
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	return {
		parse: (source) => parser.parse(source) as TSTree,
		place: (entry, source, parsed) => {
			const { bySpan, byText } = tablePlacements(readNativeTree(engine, source).tree, descendants(parsed.rootNode));
			return parsedExtras(parsed.rootNode).map((extra) => {
				const placement = bySpan.get(`${extra.startIndex}:${extra.endIndex}`) ?? byText.get(extra.text)?.shift();
				return {
					entry,
					kind: extra.type,
					start: extra.startIndex,
					end: extra.endIndex,
					owner: placement?.owner,
					position: placement?.position ?? 'lost'
				};
			});
		}
	};
}

export interface TriviaPlacementSourceOptions {
	readonly grammar: string;
	readonly source: string;
}

export async function runTriviaPlacement(opts: TriviaPlacementSourceOptions): Promise<TriviaPlacementRow[]> {
	const { parse, place } = await placementReader(assertGrammar(opts.grammar));
	return place('<source>', opts.source, parse(opts.source));
}

export async function computeTriviaPlacementCensus(grammar: string): Promise<TriviaPlacementCensus> {
	const { parse, place } = await placementReader(assertGrammar(grammar));
	const entries = loadCorpusEntries(grammar);
	const rows: TriviaPlacementRow[] = [];
	for (const entry of entries) {
		const parsed = parse(entry.source);
		if (!parsed.rootNode.hasError) rows.push(...place(entry.name, entry.source, parsed));
	}
	const count = (position: TriviaPosition): number => rows.filter((row) => row.position === position).length;
	return {
		rows,
		summary: {
			grammar,
			entries: entries.length,
			extras: rows.length,
			leading: count('leading'),
			trailing: count('trailing'),
			inner: count('inner'),
			lost: count('lost')
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
			console.log([row.entry, row.kind, `${row.start}-${row.end}`, row.owner ?? '-', row.position].join('\t'));
		}
		console.log(`# ${summary.grammar}: ${JSON.stringify(summary)}`);
	}
	return censuses.some(({ summary }) => summary.lost > 0) ? 1 : 0;
}
