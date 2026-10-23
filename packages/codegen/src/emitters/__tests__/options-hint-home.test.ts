import { describe, expect, it } from 'vitest';
import { displayFamilyNodeMap } from '../../__tests__/helpers/node-map-fixtures.ts';
import type { SitePreference } from '../../compiler/model/site-preferences.ts';
import { collectCatalogKinds, collectKindEntries } from '../kind-discriminant.ts';
import { deriveAddressTables, kindIdArmType } from '../options.ts';
import { emitTypesModules } from '../types.ts';

const SPACING = ['tight', 'space', 'newline'].map((k) => ({ value: k, kind: k }));

function twinsOf(kinds: readonly string[]): SitePreference[] {
	return kinds.map((kind) => ({
		kind,
		slot: 'statements',
		address: 'statements_separator_space',
		label: 'empty_separator_space',
		arms: SPACING,
		defaultArm: 'newline',
		source: 'spacing'
	}));
}

function hintHomeFixture(declared: boolean) {
	const sites = twinsOf(['first_block', 'second_block']);
	const { nodeMap, generatedIdTables } = displayFamilyNodeMap(
		[...sites, ...SPACING.map((arm) => ({ kind: arm.kind }))],
		['first_block', 'second_block'],
		'block',
		declared
	);
	const kindEntries = collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables);
	const addresses = deriveAddressTables(sites, kindEntries, nodeMap, kindIdArmType(kindEntries), new Map());
	return { nodeMap, generatedIdTables, addresses };
}

describe('an options root', () => {
	it('refuses two kinds that share its display when neither owns it', () => {
		const { nodeMap, generatedIdTables, addresses } = hintHomeFixture(false);
		expect(() => emitTypesModules({ grammar: 'synth', nodeMap, generatedIdTables, addresses })).toThrow(
			/names both 'first_block' and 'second_block'/
		);
	});

	it('gives each declared display-union member the shared root hint', () => {
		const { nodeMap, generatedIdTables, addresses } = hintHomeFixture(true);
		const emitted = emitTypesModules({ grammar: 'synth', nodeMap, generatedIdTables, addresses });
		expect(emitted.types).toContain('export namespace FirstBlock {');
		expect(emitted.types).toContain('export namespace SecondBlock {');
	});
});
