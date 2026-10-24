import { link, type LinkOptions } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx, type AssembledNodeMap } from '../../compiler/assemble.ts';
import { stampIrSurface } from '../../compiler/model/ir-surface.ts';
import { collectGrammarDiagnosticsForGrammar } from '../../compiler/diagnostics/grammar-diagnostics.ts';
import { predictedIdTablesOf, predictedKindsOf, type GeneratedIdEntry, type GeneratedIdTables } from '../../dsl/symbol-table.ts';
import type { LinkedGrammar, RawGrammar } from '../../compiler/types.ts';
import type { NodeMapWithIdTables } from './node-map-fixtures.ts';

export function withPredictedKinds(raw: RawGrammar): RawGrammar {
	return { ...raw, predictedKinds: predictedKindsOf(raw) };
}

export function rawIdTablesOf(raw: RawGrammar): GeneratedIdTables {
	return predictedIdTablesOf(raw.predictedKinds === undefined ? withPredictedKinds(raw) : raw);
}

export function withFixtureLexicalRanks(tables: GeneratedIdTables): GeneratedIdTables {
	const rows = tables.kindIds as unknown as ReadonlyMap<string, GeneratedIdEntry>;
	return { ...tables, kindIds: new Map([...rows].map(([kind, row]) => [kind, { ...row, parser: row.parser && { ...row.parser, lexicalRank: row.id } }])) };
}

export function linkPredicted(
	raw: RawGrammar,
	options: Omit<LinkOptions, 'generatedIdTables'> & { readonly generatedIdTables?: GeneratedIdTables } = {}
): LinkedGrammar {
	return link(raw, { ...options, generatedIdTables: options.generatedIdTables ?? rawIdTablesOf(raw) });
}

export function assemblePredicted(
	raw: RawGrammar,
	generatedIdTables?: GeneratedIdTables
): NodeMapWithIdTables & { readonly nodeMap: AssembledNodeMap } {
	const normalized = normalizeGrammar(linkPredicted(raw, { generatedIdTables }));
	const nodeMap = assemble(AssembleCtx.from(normalized));
	stampIrSurface(nodeMap, normalized.generatedIdTables);
	return { nodeMap, generatedIdTables: normalized.generatedIdTables };
}

export function diagnosePredicted(raw: RawGrammar): ReturnType<typeof collectGrammarDiagnosticsForGrammar> {
	return collectGrammarDiagnosticsForGrammar({ rawGrammar: raw, generatedIdTables: rawIdTablesOf(raw) });
}
