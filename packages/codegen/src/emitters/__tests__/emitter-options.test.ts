import { describe, expect, it } from 'vitest';
import { deriveOptionsShape, kindIdArmType, publicKindName, renderOptionsModule, type ArmTypeResolver } from '../options.ts';
import type { SitePreference } from '../../compiler/model/site-preferences.ts';
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
	it('emits only the Options type, importing the enums it names', () => {
		const src = renderOptionsModule(
			deriveOptionsShape(
				[
					terminator('return_statement'),
					spacing('formal_parameters', 'elements', 'comma_separator_space_after'),
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
				new Map([['statement', ['return_statement']]]),
				armType
			)
		);
		expect(src).toContain("import type { Delimiter, TSKindId } from './types.js';");
		expect(src).toContain('export interface Options {');
		expect(src).toContain("\treadonly statement_terminator?: TSKindId.automatic_semicolon | TSKindId.semi;");
		expect(src).toContain('\treadonly formal_parameters?: {\n\t\treadonly elements_delimiter?: Delimiter.Trailing;\n\t\treadonly elements_separator_space_after?: TSKindId.tight | TSKindId.space | TSKindId.newline;\n\t};');
		expect(src).toContain('\treadonly statement?: {\n\t\treadonly terminator_statement_terminator?: TSKindId.automatic_semicolon | TSKindId.semi;\n\t};');
		expect(src).toContain('\treadonly indent?: string;');
		expect(src).not.toMatch(/OPTION_CATALOG|OptionEntry|export const/);
	});
});
