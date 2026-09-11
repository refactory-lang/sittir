import { describe, expect, it } from 'vitest';
import { deriveAddressTables, kindIdArmType, publicKindName, renderOptionsModule, type ArmTypeResolver } from '../options.ts';
import type { PreferenceArm, SitePreference } from '../../compiler/model/site-preferences.ts';
import { siteKey } from '../../dsl/primitives/spacing.ts';

const armType: ArmTypeResolver = (arm) => (arm.kind === undefined ? arm.value : `TSKindId.${arm.kind}`);
const SPACING = ['tight', 'space', 'newline'].map((k) => ({ value: k, kind: k }));

function spacing(kind: string, slot: string, label: string, defaultArm = 'space'): SitePreference {
	return { kind, slot, address: siteKey(slot, label), label, arms: SPACING, defaultArm, source: 'spacing' };
}

function terminator(kind: string): SitePreference {
	return {
		kind,
		slot: 'terminator',
		address: 'terminator_statement_terminator',
		label: 'statement_terminator',
		arms: [
			{ value: 'automatic_semicolon', kind: 'automatic_semicolon' },
			{ value: ';', kind: 'semi' }
		],
		defaultArm: ';',
		source: 'declared'
	};
}

describe('renderOptionsModule', () => {
	const kindEntries = [
		{ kind: 'comma', member: 'Comma', symbolName: ',', anon: true },
		{ kind: 'semi', member: 'Semi', symbolName: ';', anon: true },
		{ kind: 'tight', member: 'tight' },
		{ kind: 'space', member: 'space' },
		{ kind: 'newline', member: 'newline' }
	];

	it('emits the address types and the mapped Options type, importing the enums the sites name', () => {
		const spacingType = 'TSKindId.tight | TSKindId.space | TSKindId.newline';
		const delimiter: SitePreference = {
			kind: 'formal_parameters',
			slot: 'elements',
			address: 'elements_delimiter',
			label: 'delimiter',
			arms: [{ value: 'Delimiter.Trailing' }],
			defaultArm: 'Delimiter.None',
			source: 'delimiter'
		};
		const sites = [terminator('return_statement'), spacing('formal_parameters', 'elements', 'comma_separator_space_after'), delimiter];
		const src = renderOptionsModule({ spacingType, addresses: deriveAddressTables(sites, kindEntries, armType, new Map()) });
		expect(src).toContain("import type { Delimiter, TSKindId } from './types.js';");
		expect(src).toContain(`export type SpacingArm = ${spacingType};`);
		expect(src).toContain(`export type WhitespaceArm = ${spacingType};`);
		expect(src).toContain("export type AddressRoot = 'formal_parameters' | 'return_statement';");
		expect(src).toContain("readonly 'formal_parameters/elements/delimiter': Delimiter.Trailing;");
		expect(src).toContain("readonly 'formal_parameters/elements/separator/,/after': SpacingArm;");
		expect(src).toContain("readonly 'return_statement/terminator/statement_terminator': TSKindId.automatic_semicolon | TSKindId.semi;");
		expect(src).toContain('export type Options = AddressedOptions & { readonly indent?: string };');
		expect(src).not.toMatch(/SpacingLabel|KindSpacing|SitesOf|Members|EdgeKind|OPTION_CATALOG|export const/);
	});

	it('types a site that admits indent and dedent by the wider union', () => {
		const spacingType = 'TSKindId.tight | TSKindId.space | TSKindId.newline';
		const whitespaceType = `${spacingType} | TSKindId.indent | TSKindId.dedent`;
		const WHITESPACE = ['tight', 'space', 'newline', 'indent', 'dedent'].map((k) => ({ value: k, kind: k }));
		const edge: SitePreference = { kind: 'block', slot: 'block', address: 'block_before', label: 'block_before', arms: WHITESPACE, defaultArm: 'tight', source: 'spacing', side: 'seam' };
		const src = renderOptionsModule({ spacingType, whitespaceType, addresses: deriveAddressTables([edge], kindEntries, armType, new Map()) });
		expect(src).toContain(`export type WhitespaceArm = ${whitespaceType};`);
		expect(src).toContain("readonly 'block/before': WhitespaceArm;");
	});
});

describe('deriveAddressTables', () => {
	const addressArm = (arm: PreferenceArm): string => `TSKindId.${arm.kind ?? arm.value}`;
	const kindEntries = [
		{ kind: 'lbrace', member: 'Lbrace', symbolName: '{', anon: true },
		{ kind: 'tight', member: 'Tight' },
		{ kind: 'space', member: 'Space' }
	];
	const arms = ['tight', 'space'].map((k) => ({ value: k, kind: k }));
	const site = (kind: string, slot: string, address: string): SitePreference => ({
		kind,
		slot,
		address,
		label: address,
		arms,
		defaultArm: 'tight',
		source: 'spacing',
		side: 'seam'
	});

	it('splits an address into the branches above a site and the site itself', () => {
		const tables = deriveAddressTables([site('block', 'lbrace', 'lbrace_after'), site('block', 'block', 'block_before')], kindEntries, addressArm, new Map());
		expect(tables.roots).toEqual(['block']);
		expect(tables.branches).toEqual([
			{ path: 'block', children: ['before', '{'], segments: [{ kind: 'kind-match', name: 'block' }] },
			{
				path: 'block/{',
				children: ['after'],
				segments: [
					{ kind: 'kind-match', name: 'block' },
					{ kind: 'literal', text: '{' }
				]
			}
		]);
		expect(tables.leaves.map((l) => l.path)).toEqual(['block/before', 'block/{/after']);
		expect(tables.depth).toBe(3);
	});

	it('emits the tables and a mapped type unrolled to the depth the grammar needs', () => {
		const sites = [site('block', 'lbrace', 'lbrace_after')];
		const src = renderOptionsModule({
			spacingType: 'TSKindId.tight | TSKindId.space',
			addresses: deriveAddressTables(sites, kindEntries, addressArm, new Map())
		});
		expect(src).toContain("export type AddressRoot = 'block';");
		expect(src).toContain("export interface AddressBranch {\n\treadonly block: '{';\n\treadonly 'block/{': 'after';\n}");
		expect(src).toContain("export interface AddressLeaf {\n\treadonly 'block/{/after': SpacingArm;\n}");
		expect(src).toContain('export type AddressedOptions = { readonly [K in AddressRoot]?: AddressNode1<K> };');
		expect(src).toContain('type AddressNode2<P extends string> = P extends keyof AddressBranch');
		expect(src).not.toContain('AddressNode3<');
	});
});
