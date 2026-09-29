import { assertGrammar, stableGrammars } from '@sittir/codegen/grammars';
import { loadCorpusEntries, loadKindNameFromId, loadLanguageForGrammar, loadNativeEngine, readNativeTree, type TSNode, type TSTree } from './common.ts';

export type TriviaPosition = 'leading' | 'trailing' | `inner:${string}` | 'lost';

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
	readonly inner: Readonly<Record<string, number>>;
	readonly lost: number;
}

export interface TriviaPlacementCensus {
	readonly summary: TriviaPlacementSummary;
	readonly rows: readonly TriviaPlacementRow[];
}

interface ReadEntry {
	readonly $span?: { readonly start: number; readonly end: number };
}

interface ReadTrivia {
	readonly leading?: readonly ReadEntry[];
	readonly trailing?: readonly ReadEntry[];
	readonly inner?: Readonly<Record<string, readonly ReadEntry[]>>;
}

interface Placement {
	readonly owner: number;
	readonly position: Exclude<TriviaPosition, 'lost'>;
}

type PlaceSource = (entry: string, source: string, parsed: TSTree) => TriviaPlacementRow[];

interface PlacementReader {
	readonly parse: (source: string) => TSTree;
	readonly place: PlaceSource;
}

function readPlacements(root: unknown): Map<string, Placement> {
	const placements = new Map<string, Placement>();
	const place = (entries: readonly ReadEntry[] | undefined, owner: number, position: Placement['position']): void => {
		for (const { $span } of entries ?? []) {
			if ($span !== undefined) placements.set(`${$span.start}:${$span.end}`, { owner, position });
		}
	};
	const visit = (value: unknown): void => {
		if (Array.isArray(value)) {
			for (const item of value) visit(item);
			return;
		}
		if (value === null || typeof value !== 'object') return;
		const node = value as Record<string, unknown>;
		const trivia = node.$_trivia as ReadTrivia | undefined;
		if (trivia !== undefined && typeof node.$type === 'number') {
			place(trivia.leading, node.$type, 'leading');
			place(trivia.trailing, node.$type, 'trailing');
			for (const [key, entries] of Object.entries(trivia.inner ?? {})) place(entries, node.$type, `inner:${key}`);
		}
		for (const [key, child] of Object.entries(node)) if (key !== '$_trivia') visit(child);
	};
	visit(root);
	return placements;
}

function parsedExtras(node: TSNode): TSNode[] {
	return node.isExtra ? [node] : node.children.flatMap(parsedExtras);
}

async function placementReader(grammar: string): Promise<PlacementReader> {
	const engine = await loadNativeEngine(grammar);
	const kindName = (await loadKindNameFromId(grammar))!;
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	return {
		parse: (source) => parser.parse(source) as TSTree,
		place: (entry, source, parsed) => {
			const placements = readPlacements(readNativeTree(engine, source, { deep: true }).root);
			return parsedExtras(parsed.rootNode).map((extra) => {
				const placement = placements.get(`${extra.startIndex}:${extra.endIndex}`);
				return {
					entry,
					kind: extra.type,
					start: extra.startIndex,
					end: extra.endIndex,
					owner: placement === undefined ? undefined : kindName(placement.owner),
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
	const inner: Record<string, number> = {};
	for (const { position } of rows) if (position.startsWith('inner:')) inner[position] = (inner[position] ?? 0) + 1;
	const count = (position: TriviaPosition): number => rows.filter((row) => row.position === position).length;
	return {
		rows,
		summary: {
			grammar,
			entries: entries.length,
			extras: rows.length,
			leading: count('leading'),
			trailing: count('trailing'),
			inner,
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
