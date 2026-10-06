import { assertGrammar, stableGrammars } from '@sittir/codegen/grammars';
import { ENVELOPE_EXTRA_IDS } from '@sittir/codegen/envelope-claims';
import { STORED_TRIVIA, toDetachedTransportData, treeTokenOf } from '@sittir/common/utils';
import type { AnyUntypedNode } from '@sittir/types';
import { loadCorpusEntries, loadLanguageForGrammar, loadNativeEngine, type TSNode, type TSTree } from './common.ts';

export type TypedReadParityOutcome = 'refused' | 'differs' | 'today-failed';

export interface TypedReadParityRow {
	readonly entry: string;
	readonly outcome: TypedReadParityOutcome;
	readonly report: string;
}

export interface EmptySlotRow {
	readonly entry: string;
	readonly kind: string;
	readonly slot: string;
}

const EMPTY_SLOT_PREFIX = 'normalized: ';

export interface EnvelopePinRow {
	readonly variant: string;
	readonly display: number;
	readonly id: number;
	readonly shown: number;
}

export interface TypedReadParitySummary {
	readonly grammar: string;
	readonly entries: number;
	readonly agreed: number;
	readonly refused: number;
	readonly differs: number;
	readonly todayFailed: number;
	readonly emptySlots: number;
}

export interface TypedReadParityCensus {
	readonly summary: TypedReadParitySummary;
	readonly rows: readonly TypedReadParityRow[];
	readonly pins: readonly EnvelopePinRow[];
	readonly emptySlots: readonly EmptySlotRow[];
}

function withoutLayoutEvidence(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(withoutLayoutEvidence);
	if (value === null || typeof value !== 'object') return value;
	const out: Record<string, unknown> = {};
	for (const [key, member] of Object.entries(value)) {
		if (key !== '$_layout') {
			out[key] = withoutLayoutEvidence(member);
			continue;
		}
		const { gap: _gap, flank: _flank, trivia, ...rest } = member as Record<string, unknown>;
		const entries = trivia === undefined ? [] : Object.values(trivia as Record<string, unknown>).filter((side) => side !== undefined);
		const layout = entries.length === 0 ? rest : { ...rest, trivia: withoutLayoutEvidence(trivia) };
		if (Object.keys(layout).length > 0) out[key] = layout;
	}
	return out;
}

function parseReport(entry: string, report: string): { emptySlots: EmptySlotRow[]; difference: string } {
	const emptySlots: EmptySlotRow[] = [];
	const rest: string[] = [];
	for (const line of report.split('\n')) {
		if (!line.startsWith(EMPTY_SLOT_PREFIX) || rest.length > 0) {
			rest.push(line);
			continue;
		}
		const [kind = '', slot = ''] = line.slice(EMPTY_SLOT_PREFIX.length).split('.');
		emptySlots.push({ entry, kind, slot });
	}
	return { emptySlots, difference: rest.join('\n') };
}

function pinCounts(grammar: string): Map<string, number> {
	const counts = new Map<string, number>();
	for (const [variant, { display, extras }] of Object.entries(ENVELOPE_EXTRA_IDS[grammar] ?? {})) {
		for (const id of extras) counts.set(`${variant}\t${display}\t${id}`, 0);
	}
	return counts;
}

function countShownPins(node: TSNode, counts: Map<string, number>, byShown: Map<string, string[]>): void {
	const keys = byShown.get(`${node.typeId}:${node.grammarId}`);
	if (keys !== undefined) for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
	for (const child of node.children) countShownPins(child, counts, byShown);
}

export function emptySlotKey(entry: string, kind: string, slot: string): string {
	return `${entry}\t${kind}\t${slot}`;
}

export const LISTED_EMPTY_SLOTS: Readonly<Record<string, readonly string[]>> = {
	rust: [
		emptySlotKey('Attribute macros', 'DelimTokenTreeParenTransport', 'delim_tokens'),
		emptySlotKey('Macro invocations inside trait declarations', 'DelimTokenTreeBraceTransport', 'delim_tokens'),
		emptySlotKey('Scoped functions with macros as types', 'DelimTokenTreeBracketTransport', 'delim_tokens'),
		emptySlotKey('Macro invocation - no arguments', 'DelimTokenTreeParenTransport', 'delim_tokens'),
		emptySlotKey('Macro invocation - no arguments', 'DelimTokenTreeBracketTransport', 'delim_tokens'),
		emptySlotKey('Macro invocation - no arguments', 'DelimTokenTreeBraceTransport', 'delim_tokens'),
		emptySlotKey('Macro invocation - arbitrary tokens', 'DelimTokenTreeParenTransport', 'delim_tokens'),
		emptySlotKey('Or patterns', 'DelimTokenTreeParenTransport', 'delim_tokens')
	],
	typescript: [
		emptySlotKey('Export assignments', 'ObjectTransport', 'properties'),
		emptySlotKey('Method declarations with keywords as names', 'StatementBlockTransport', 'statements'),
		emptySlotKey('Method declarations with keywords as names', 'StatementBlockTransport', 'terminator')
	]
};

export async function computeTypedReadParity(grammar: string): Promise<TypedReadParityCensus> {
	const engine = await loadNativeEngine(assertGrammar(grammar));
	const entries = loadCorpusEntries(grammar);
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	const pins = pinCounts(grammar);
	const byShown = new Map<string, string[]>();
	for (const key of pins.keys()) {
		const [, display, id] = key.split('\t');
		const shown = `${display}:${id}`;
		byShown.set(shown, [...(byShown.get(shown) ?? []), key]);
	}
	const rows: TypedReadParityRow[] = [];
	const emptySlots: EmptySlotRow[] = [];
	const listed = new Set(LISTED_EMPTY_SLOTS[grammar] ?? []);
	let agreed = 0;
	for (const entry of entries) {
		const parsed = parser.parse(entry.source) as TSTree;
		countShownPins(parsed.rootNode, pins, byShown);
		const root = engine.parse(entry.source, { deep: true }) as object;
		const treeId = treeTokenOf(root)?.treeId;
		if (treeId === undefined) throw new Error(`typed-read-parity: ${entry.name}'s parsed root holds no tree`);
		const refusal = engine.diagnostics.typedReadRefusal(treeId);
		if (refusal !== null) {
			rows.push({ entry: entry.name, outcome: 'refused', report: refusal });
			continue;
		}
		let report: string | null;
		try {
			report = engine.diagnostics.typedReadParity(treeId, withoutLayoutEvidence(toDetachedTransportData(root as AnyUntypedNode, STORED_TRIVIA)));
		} catch (e) {
			rows.push({ entry: entry.name, outcome: 'today-failed', report: (e as Error).message });
			continue;
		}
		const { emptySlots: found, difference } = report === null ? { emptySlots: [], difference: '' } : parseReport(entry.name, report);
		const unlisted = found.filter(({ entry: name, kind, slot }) => !listed.has(emptySlotKey(name, kind, slot)));
		emptySlots.push(...found);
		if (difference === '' && unlisted.length === 0) agreed++;
		else {
			const notes = unlisted.map(({ kind, slot }) => `empty slot not in the listed rows: ${kind}.${slot}`);
			rows.push({ entry: entry.name, outcome: 'differs', report: [...notes, difference].filter((part) => part !== '').join('\n') });
		}
	}
	const count = (outcome: TypedReadParityOutcome): number => rows.filter((row) => row.outcome === outcome).length;
	return {
		rows,
		emptySlots,
		pins: [...pins].map(([key, shown]) => {
			const [variant = '', display = '', id = ''] = key.split('\t');
			return { variant, display: Number(display), id: Number(id), shown };
		}),
		summary: { grammar, entries: entries.length, agreed, refused: count('refused'), differs: count('differs'), todayFailed: count('today-failed'), emptySlots: emptySlots.length }
	};
}

export interface TypedReadParityOptions {
	readonly grammar: string;
	readonly allGrammars: boolean;
	readonly json: boolean;
}

export async function run(opts: TypedReadParityOptions): Promise<number> {
	const grammars = opts.allGrammars ? stableGrammars() : [assertGrammar(opts.grammar)];
	const censuses: TypedReadParityCensus[] = [];
	for (const grammar of grammars) censuses.push(await computeTypedReadParity(grammar));
	if (opts.json) {
		console.log(JSON.stringify(opts.allGrammars ? censuses : censuses[0], null, 2));
	} else {
		for (const { summary, rows, pins, emptySlots } of censuses) {
			for (const row of emptySlots) console.log(`empty ${summary.grammar} ${emptySlotKey(row.entry, row.kind, row.slot).replaceAll('\t', ' | ')}`);
			for (const row of rows) console.log(`${row.entry}\t${row.outcome}\n${row.report}\n`);
			for (const pin of pins) console.log(`pin ${summary.grammar} ${pin.variant} display ${pin.display} id ${pin.id}: ${pin.shown} corpus nodes`);
			console.log(`# ${summary.grammar}: ${JSON.stringify(summary)}`);
		}
	}
	return censuses.some(({ summary }) => summary.refused + summary.differs + summary.todayFailed > 0) ? 1 : 0;
}
