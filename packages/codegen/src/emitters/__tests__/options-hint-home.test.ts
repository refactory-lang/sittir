import { describe, expect, it } from 'vitest';
import { ERROR_KIND_NAME } from '@sittir/common/error-kind';
import { makeSiteKindsNodeMap, withGeneratedIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';
import { ERROR_KIND_ROW, collectGeneratedKindEntries, type GeneratedKindEntry } from '../../dsl/symbol-table.ts';
import { stampIrSurface } from '../../compiler/model/ir-surface.ts';
import type { SitePreference } from '../../compiler/model/site-preferences.ts';
import { collectCatalogKinds, collectKindEntries } from '../kind-discriminant.ts';
import { deriveAddressTables, kindIdArmType } from '../options.ts';
import { emitTypesModules } from '../types.ts';

const SPACING = ['tight', 'space', 'newline'].map((k) => ({ value: k, kind: k }));

function twinsOf(kinds: readonly string[]): SitePreference[] {
	return kinds.map((kind) => ({ kind, slot: 'statements', address: 'statements_separator_space', label: 'empty_separator_space', arms: SPACING, defaultArm: 'newline', source: 'spacing' }));
}

describe('an options root', () => {
	it('refuses two kinds that share its display when neither owns it', () => {
		const sites = twinsOf(['first_block', 'second_block']);
		const build = (kindEntries: readonly GeneratedKindEntry[]) => makeSiteKindsNodeMap([...sites, ...SPACING.map((arm) => ({ kind: arm.kind }))], kindEntries);
		const { generatedIdTables } = withGeneratedIdTables(build);
		if (!(generatedIdTables.kindIds instanceof Map)) throw new Error('fixture kind IDs must be a map');
		for (const kind of ['first_block', 'second_block']) {
			const row = generatedIdTables.kindIds.get(kind)!;
			generatedIdTables.kindIds.set(kind, { ...row, parser: { ...row.parser!, symbolName: 'block' } });
		}
		generatedIdTables.kindIds.set(ERROR_KIND_NAME, ERROR_KIND_ROW);
		const nodeMap = build(collectGeneratedKindEntries(generatedIdTables));
		stampIrSurface(nodeMap, generatedIdTables);
		const kindEntries = collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables);
		const addresses = deriveAddressTables(sites, kindEntries, nodeMap, kindIdArmType(kindEntries), new Map());
		expect(() => emitTypesModules({ grammar: 'synth', nodeMap, generatedIdTables, addresses })).toThrow(/names both 'first_block' and 'second_block'/);
	});
});
