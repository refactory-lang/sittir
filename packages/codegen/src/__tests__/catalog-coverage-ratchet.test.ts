import { describe, expect, it } from 'vitest';
import { compileGrammar } from '../compiler/compile.ts';
import { loadPackageIdTables } from '../compiler/generated-metadata.ts';
import { auxTokenKinds, catalogCoverage, type CatalogCoverageSite } from '../compiler/diagnostics/catalog-coverage.ts';
import { collectGeneratedKindEntries } from '../dsl/symbol-table.ts';
import { allGrammars, grammarPackage } from '../grammars.ts';
import { FULL_PIPELINE_TIMEOUT } from './helpers/timeouts.ts';

const UNRESOLVED_ARM_CEILINGS: Readonly<Record<string, number>> = {
	rust: 2
};

function sites(found: readonly CatalogCoverageSite[]): string {
	return found.map((site) => `${site.ownerKind}.${site.slot} -> ${site.arm}`).join('\n');
}

describe('catalog-coverage ratchet', () => {
	for (const grammar of allGrammars()) {
		it(
			`${grammar}: no anonymous auxiliary token, and slot arms without a catalog kind and no parser-hidden kind on the surface`,
			async () => {
				const pkg = grammarPackage(grammar);
				const { nodeMap, raw, linked } = await compileGrammar({ package: pkg, generatedIdTables: await loadPackageIdTables(pkg) });
				const { unresolvedArms, hiddenPublicArms } = catalogCoverage(nodeMap);
				expect(auxTokenKinds(collectGeneratedKindEntries(linked.generatedIdTables), raw.rules), `${grammar} anonymous auxiliary tokens`).toEqual([]);
				expect(unresolvedArms.length, `${grammar} slot arms without a catalog kind:\n${sites(unresolvedArms)}`).toBeLessThanOrEqual(
					UNRESOLVED_ARM_CEILINGS[grammar] ?? 0
				);
				expect(hiddenPublicArms, `${grammar} parser-hidden kinds on the surface:\n${sites(hiddenPublicArms)}`).toEqual([]);
			},
			FULL_PIPELINE_TIMEOUT
		);
	}
});
