import { describe, expect, it } from 'vitest';
import { grammarPackage } from '../../grammars.ts';
import { evaluatePackage } from '../evaluate-package.ts';
import { loadPackageIdTables } from '../../compiler/generated-metadata.ts';
import { collectGeneratedKindEntries, generatedFieldIds, predictedIdTablesOf } from '../symbol-table.ts';

describe('predicted id tables agree with the parser tree-sitter generated', () => {
	it.each(['rust', 'typescript', 'python', 'scm', 'regex'])('%s: field ids and kind ids', async (grammar) => {
		const pkg = grammarPackage(grammar);
		const parser = await loadPackageIdTables(pkg);
		const predicted = predictedIdTablesOf(await evaluatePackage(pkg));
		expect(generatedFieldIds(predicted)).toEqual(generatedFieldIds(parser));
		const ids = (entries: ReturnType<typeof collectGeneratedKindEntries>) => entries.map(({ kind, id }) => [kind, id]).sort();
		expect(ids(collectGeneratedKindEntries(predicted))).toEqual(ids(collectGeneratedKindEntries(parser)));
	}, 120_000);
});
