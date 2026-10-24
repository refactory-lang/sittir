import { describe, expect, it } from 'vitest';
import { grammarPackage } from '../../grammars.ts';
import { evaluatePackage } from '../evaluate-package.ts';
import { loadPackageIdTables } from '../../compiler/generated-metadata.ts';
import { collectGeneratedKindEntries, generatedFieldIds, predictedIdTablesOf, type GeneratedIdTables } from '../symbol-table.ts';

const LINK_STAMPED = new Set(['parser.visibleExternal']);

type IdRow = { readonly id: number; readonly parseId?: number; readonly parseName?: string; readonly parser?: Readonly<Record<string, unknown>> };

function rowsOf(tables: GeneratedIdTables): ReadonlyMap<string, IdRow> {
	const ids = tables.kindIds as unknown as ReadonlyMap<string, IdRow> | Readonly<Record<string, IdRow>>;
	return ids instanceof Map ? ids : new Map(Object.entries(ids));
}

function rowFieldDrift(parser: GeneratedIdTables, predicted: GeneratedIdTables): string[] {
	const parserRows = rowsOf(parser);
	const drift: string[] = [];
	for (const [kind, row] of rowsOf(predicted)) {
		const real = parserRows.get(kind);
		if (real === undefined) continue;
		const fields: [string, unknown, unknown][] = [
			['id', row.id, real.id],
			['parseId', row.parseId, real.parseId],
			['parseName', row.parseName, real.parseName],
			...Object.entries(row.parser ?? {}).map(([field, value]): [string, unknown, unknown] => [`parser.${field}`, value, real.parser?.[field]])
		];
		for (const [field, value, expected] of fields) {
			if (value === undefined || LINK_STAMPED.has(field)) continue;
			if (JSON.stringify(value) !== JSON.stringify(expected)) drift.push(`${kind}.${field}: parser=${JSON.stringify(expected)} predicted=${JSON.stringify(value)}`);
		}
	}
	return drift;
}

describe('predicted id tables agree with the parser tree-sitter generated', () => {
	it.each(['rust', 'typescript', 'python', 'scm', 'regex'])('%s: field ids, kind ids and every field a predicted row carries', async (grammar) => {
		const pkg = grammarPackage(grammar);
		const parser = await loadPackageIdTables(pkg);
		const predicted = predictedIdTablesOf(await evaluatePackage(pkg));
		expect(generatedFieldIds(predicted)).toEqual(generatedFieldIds(parser));
		const ids = (entries: ReturnType<typeof collectGeneratedKindEntries>) => entries.map(({ kind, id }) => [kind, id]).sort();
		expect(ids(collectGeneratedKindEntries(predicted))).toEqual(ids(collectGeneratedKindEntries(parser)));
		expect(rowFieldDrift(parser, predicted)).toEqual([]);
	}, 120_000);

	it.each(['rust', 'typescript', 'python'])('%s: a predicted row carries no lexical rank, which only the parser knows', async (grammar) => {
		const predicted = predictedIdTablesOf(await evaluatePackage(grammarPackage(grammar)));
		expect(collectGeneratedKindEntries(predicted).filter((entry) => entry.lexicalRank !== undefined).map((entry) => entry.kind)).toEqual([]);
	}, 120_000);
});
