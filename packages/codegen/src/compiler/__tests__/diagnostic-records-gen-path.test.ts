import { describe, expect, it } from 'vitest';
import { compileGrammar, type Compilation } from '../compile.ts';
import { loadGeneratedIdTables } from '../generated-metadata.ts';
import { grammarPackage } from '../../grammars.ts';

const compiled = new Map<string, Promise<Compilation>>();
const compilationOf = (grammar: string): Promise<Compilation> => {
	const known = compiled.get(grammar);
	if (known !== undefined) return known;
	const compilation = loadGeneratedIdTables(grammar).then((generatedIdTables) => compileGrammar({ package: grammarPackage(grammar), generatedIdTables }));
	compiled.set(grammar, compilation);
	return compilation;
};

describe('diagnostic records on the gen path', () => {
	it('a patch through a lift renamed by a variant hoist claims the lift-owned key', async () => {
		const { diagnosticRecords } = await compilationOf('typescript');
		const key = diagnosticRecords.find((r) => r.ownerKind === 'export_statement_arm5' && r.resolved);
		expect(key?.resolvedBy?.by).toContainEqual(expect.objectContaining({ patch: expect.objectContaining({ ownerKind: 'export_statement' }) }));
	}, 180_000);

	it('the comparison_operator field patches resolve its nested-seq shape in wire', async () => {
		const { diagnosticRecords } = await compilationOf('python');
		expect(diagnosticRecords.find((r) => r.code === 'multi-slot-nested-seq' && r.ownerKind === 'comparison_operator')).toEqual(
			expect.objectContaining({ resolved: true, resolvedBy: expect.objectContaining({ stage: 'wire' }) })
		);
	}, 180_000);

	for (const grammar of ['python', 'typescript']) {
		it(`${grammar}: a kind keeps one root rule id across the raw, enriched and final stages`, async () => {
			const { stages, raw } = await compilationOf(grammar);
			const catalogs = [stages!.raw.ruleCatalog!, stages!.enriched.ruleCatalog!, raw.ruleCatalog];
			const shared = [...catalogs[2]!.rootsByKind.keys()].filter((kind) => catalogs.every((c) => c.rootsByKind.has(kind)));
			expect(shared.length).toBeGreaterThan(0);
			for (const kind of shared) {
				expect(new Set(catalogs.map((c) => c.rootsByKind.get(kind))), kind).toEqual(new Set([catalogs[2]!.rootsByKind.get(kind)]));
			}
		}, 180_000);
	}

	it('a kind renamed in some stages keeps its source rule id in every stage', async () => {
		const { stages, raw } = await compilationOf('python');
		expect(raw.ruleCatalog.rootsByKind.get('match_block')).toBe('rule:_match_block:root');
		for (const catalog of [stages!.raw.ruleCatalog!, stages!.enriched.ruleCatalog!]) {
			expect([...catalog.rootsByKind.values()]).toContain('rule:_match_block:root');
		}
	}, 180_000);
});
