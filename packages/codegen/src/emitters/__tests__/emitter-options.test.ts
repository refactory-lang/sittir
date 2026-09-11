import { describe, expect, it } from 'vitest';
import { deriveAddressTables, deriveOptionsShape, kindIdArmType, publicKindName, renderOptionsModule, type ArmTypeResolver } from '../options.ts';
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

describe('deriveOptionsShape', () => {
	it('a preference is a top-level key and a <slot>_<label> key under every site kind', () => {
		const shape = deriveOptionsShape([terminator('return_statement'), terminator('throw_statement')], new Map(), armType);
		expect(shape.topLevel).toEqual([
			{ key: 'statement_terminator', type: 'TSKindId.automatic_semicolon | TSKindId.semi' }
		]);
		expect(shape.kinds).toEqual([
			{
				key: 'return_statement',
				entries: [{ key: 'terminator_statement_terminator', type: 'TSKindId.automatic_semicolon | TSKindId.semi' }]
			},
			{
				key: 'throw_statement',
				entries: [{ key: 'terminator_statement_terminator', type: 'TSKindId.automatic_semicolon | TSKindId.semi' }]
			}
		]);
	});

	it('a spacing phantom is keyed by its label at the top and per site, both sides of the token', () => {
		const shape = deriveOptionsShape(
			[
				spacing('formal_parameters', 'elements', 'comma_separator_space_before', 'tight'),
				spacing('formal_parameters', 'elements', 'comma_separator_space_after'),
				spacing('statement_block', 'statements', 'empty_separator_space', 'newline')
			],
			new Map(),
			armType
		);
		expect(shape.topLevel.map((e) => e.key)).toEqual([
			'comma_separator_space_after',
			'comma_separator_space_before',
			'empty_separator_space'
		]);
		expect(shape.kinds[0]).toEqual({
			key: 'formal_parameters',
			entries: [
				{ key: 'elements_separator_space_after', type: 'TSKindId.tight | TSKindId.space | TSKindId.newline' },
				{ key: 'elements_separator_space_before', type: 'TSKindId.tight | TSKindId.space | TSKindId.newline' }
			]
		});
	});

	it('a token seam is keyed by its label at the top and under its kind', () => {
		const seam: SitePreference = { kind: 'call_expression', slot: 'lparen', address: 'lparen_before', label: 'lparen_before', arms: SPACING, defaultArm: 'tight', source: 'spacing', side: 'seam' };
		const shape = deriveOptionsShape([seam], new Map(), armType);
		expect(shape.topLevel).toEqual([{ key: 'lparen_before', type: 'TSKindId.tight | TSKindId.space | TSKindId.newline' }]);
		expect(shape.kinds).toEqual([{ key: 'call_expression', entries: [{ key: 'lparen_before', type: 'TSKindId.tight | TSKindId.space | TSKindId.newline' }] }]);
	});

	it('a delimiter preference has no top-level key and types by the bitflag', () => {
		const shape = deriveOptionsShape(
			[
				{
					kind: 'formal_parameters',
					slot: 'elements',
					address: 'elements_delimiter',
					label: 'delimiter',
					arms: [{ value: 'Delimiter.Trailing' }],
					defaultArm: 'Delimiter.None',
					source: 'delimiter'
				}
			],
			new Map(),
			armType
		);
		expect(shape.topLevel).toEqual([]);
		expect(shape.kinds).toEqual([
			{ key: 'formal_parameters', entries: [{ key: 'elements_delimiter', type: 'Delimiter.Trailing' }] }
		]);
	});

	it('a supertype carries the union of its members entries under one key', () => {
		const shape = deriveOptionsShape(
			[terminator('return_statement'), terminator('throw_statement'), spacing('class_declaration', 'decorator', 'empty_separator_space')],
			new Map([
				['statement', ['return_statement', '_throw_statement', 'class_declaration']],
				['_declaration', ['class_declaration']]
			]),
			armType
		);
		expect(shape.supertypes).toEqual([
			{
				key: 'declaration',
				entries: [{ key: 'decorator_separator_space', type: 'TSKindId.tight | TSKindId.space | TSKindId.newline' }]
			},
			{
				key: 'statement',
				entries: [
					{ key: 'decorator_separator_space', type: 'TSKindId.tight | TSKindId.space | TSKindId.newline' },
					{ key: 'terminator_statement_terminator', type: 'TSKindId.automatic_semicolon | TSKindId.semi' }
				]
			}
		]);
	});

	it('a hidden kind is addressed by its visible name', () => {
		const shape = deriveOptionsShape([terminator('_return_statement')], new Map(), armType);
		expect(shape.kinds[0]!.key).toBe('return_statement');
		expect(publicKindName('_types')).toBe('types');
	});

	it('one label with differing arms across sites fails loudly', () => {
		const other: SitePreference = { ...terminator('a'), arms: [{ value: ',', kind: 'comma' }], defaultArm: ',' };
		expect(() => deriveOptionsShape([terminator('b'), other], new Map(), armType)).toThrow(
			/preference 'statement_terminator' differs/
		);
	});

	it('a label colliding with a kind or supertype name fails loudly', () => {
		expect(() => deriveOptionsShape([spacing('statement_terminator', 'x', 'statement_terminator')], new Map(), armType)).toThrow(
			/top-level key 'statement_terminator'/
		);
	});

	it('kind-id arm typing resolves through the catalog and rejects an unknown kind', () => {
		const resolve = kindIdArmType([
			{ kind: 'semi', member: 'Semi', id: 3, symbolName: ';', anon: true },
			{ kind: '_space', member: 'Space', id: 4 }
		]);
		expect(resolve({ value: ';', kind: 'semi' })).toBe('TSKindId.Semi');
		expect(resolve({ value: 'space', kind: 'space' })).toBe('TSKindId.Space');
		expect(resolve({ value: 'Delimiter.Trailing' })).toBe('Delimiter.Trailing');
		expect(() => resolve({ value: 'x', kind: 'nope' })).toThrow(/has no kind id/);
	});
});

describe('renderOptionsModule', () => {
	it('emits the catalog and the mapped Options type, importing the enums it names', () => {
		const spacingType = 'TSKindId.tight | TSKindId.space | TSKindId.newline';
		const seam = (kind: string, address: string): SitePreference => ({ kind, slot: kind, address, label: address, arms: SPACING, defaultArm: 'tight', source: 'spacing', side: 'seam' });
		const supertypeMembers = new Map([['_statement', ['return_statement', 'block']]]);
		const src = renderOptionsModule(
			deriveOptionsShape(
				[
					terminator('return_statement'),
					spacing('formal_parameters', 'elements', 'comma_separator_space_after'),
					seam('block', 'block_before'),
					seam('block', 'block_after'),
					seam('block', 'lbrace_after'),
					{
						kind: 'formal_parameters',
						slot: 'elements',
						address: 'elements_delimiter',
						label: 'delimiter',
						arms: [{ value: 'Delimiter.Trailing' }],
						defaultArm: 'Delimiter.None',
						source: 'delimiter'
					}
				],
				supertypeMembers,
				armType
			),
			{ spacingType, supertypeMembers }
		);
		expect(src).toContain("import type { Delimiter, TSKindId } from './types.js';");
		expect(src).toContain(`export type Spacing = ${spacingType};`);
		expect(src).toContain("export type EdgeKind = 'block';");
		expect(src).toContain("export type SpacingLabel = 'comma_separator_space_after' | 'lbrace_after';");
		expect(src).toContain('export interface OtherLabels {\n\treadonly statement_terminator?: TSKindId.automatic_semicolon | TSKindId.semi;\n}');
		expect(src).toContain("export interface KindSpacing {\n\treadonly block: 'lbrace_after';\n\treadonly formal_parameters: 'elements_separator_space_after';\n}");
		expect(src).toContain('export interface KindOther {\n\treadonly formal_parameters: {\n\t\treadonly elements_delimiter?: Delimiter.Trailing;\n\t};\n\treadonly return_statement: {\n\t\treadonly terminator_statement_terminator?: TSKindId.automatic_semicolon | TSKindId.semi;\n\t};\n}');
		expect(src).toContain("export interface Members {\n\treadonly statement: 'block' | 'return_statement';\n}");
		expect(src).toContain(`export type Whitespace = ${spacingType};`);
		expect(src).toContain('export type WhitespaceLabel = never;');
		expect(src).toContain('export interface KindWhitespace {\n}');
		expect(src).toContain('export type Options = { readonly [L in SpacingLabel]?: Spacing } & { readonly [L in WhitespaceLabel]?: Whitespace } & {');
		expect(src).toContain('} & AddressedOptions & { readonly indent?: string };');
		expect(src).not.toMatch(/OPTION_CATALOG|OptionEntry|export const/);
	});

	it('groups the sites that admit indent and dedent under Whitespace, edges and flanks included', () => {
		const spacingType = 'TSKindId.tight | TSKindId.space | TSKindId.newline';
		const whitespaceType = `${spacingType} | TSKindId.indent | TSKindId.dedent`;
		const WHITESPACE = ['tight', 'space', 'newline', 'indent', 'dedent'].map((k) => ({ value: k, kind: k }));
		const seam = (kind: string, address: string, label = address): SitePreference => ({ kind, slot: kind, address, label, arms: WHITESPACE, defaultArm: 'tight', source: 'spacing', side: 'seam' });
		const src = renderOptionsModule(
			deriveOptionsShape(
				[
					spacing('block', 'statements', 'empty_separator_space'),
					seam('block', 'block_before'),
					seam('block', 'block_after'),
					seam('block', 'lbrace_after', 'body_before'),
					{ kind: 'block', slot: 'statements', address: 'block_start', label: 'block_start', arms: WHITESPACE, defaultArm: 'tight', source: 'spacing', side: 'start' }
				],
				new Map(),
				armType
			),
			{ spacingType, whitespaceType }
		);
		expect(src).toContain(`export type Whitespace = ${whitespaceType};`);
		expect(src).toContain("export type EdgeKind = 'block';");
		expect(src).toContain("export type SpacingLabel = 'empty_separator_space';");
		expect(src).toContain("export type WhitespaceLabel = 'block_start' | 'body_before';");
		expect(src).toContain("export interface KindSpacing {\n\treadonly block: 'statements_separator_space';\n}");
		expect(src).toContain("export interface KindWhitespace {\n\treadonly block: 'lbrace_after';\n}");
		expect(src).toContain('export interface OtherLabels {\n}');
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
			{ path: 'block', keys: ['before', '{'] },
			{ path: 'block/{', keys: ['after'] }
		]);
		expect(tables.leaves.map((l) => l.path)).toEqual(['block/before', 'block/{/after']);
		expect(tables.depth).toBe(3);
	});

	it('emits the tables and a mapped type unrolled to the depth the grammar needs', () => {
		const sites = [site('block', 'lbrace', 'lbrace_after')];
		const src = renderOptionsModule(deriveOptionsShape(sites, new Map(), addressArm), {
			spacingType: 'TSKindId.tight | TSKindId.space',
			addresses: deriveAddressTables(sites, kindEntries, addressArm, new Map())
		});
		expect(src).toContain("export type AddressRoot = 'block';");
		expect(src).toContain("export interface AddressBranch {\n\treadonly block: '{';\n\treadonly 'block/{': 'after';\n}");
		expect(src).toContain("export interface AddressLeaf {\n\treadonly 'block/{/after': Spacing;\n}");
		expect(src).toContain('export type AddressedOptions = { readonly [K in AddressRoot]?: AddressNode1<K> };');
		expect(src).toContain('type AddressNode2<P extends string> = P extends keyof AddressBranch');
		expect(src).not.toContain('AddressNode3<');
	});
});
