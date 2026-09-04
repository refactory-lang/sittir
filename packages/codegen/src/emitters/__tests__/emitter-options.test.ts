import { describe, expect, it } from 'vitest';
import { deriveOptionCatalogFrom, publicKindName, renderOptionsModule, type CatalogNode } from '../options.ts';

function list(
	kind: string,
	separatorText: string | undefined,
	trailing: 'mandatory' | 'optional' | 'none'
): CatalogNode {
	return { kind, list: { separatorText, trailing }, slots: [] };
}

describe('deriveOptionCatalogFrom', () => {
	it('a separated list with an optional trailing flank gets separator and trailing', () => {
		expect(deriveOptionCatalogFrom([list('arguments_elements', ',', 'optional')])).toEqual([
			{
				key: 'arguments_elements',
				family: 'list',
				kind: 'arguments_elements',
				index: 0,
				values: ['tight', 'space', 'newline'],
				defaultValue: 'tight',
				valueKinds: { tight: ',', space: '_comma_space', newline: '_comma_newline' },
				trailing: true
			}
		]);
	});

	it('a separated list whose trailing flank is mandatory or absent has no trailing key', () => {
		expect(deriveOptionCatalogFrom([list('tuple_type_elements', ',', 'none')])[0]?.trailing).toBe(false);
		expect(deriveOptionCatalogFrom([list('x_elements', ';', 'mandatory')])[0]?.trailing).toBe(false);
	});

	it('a separator token without a spaced twin yields no separator values', () => {
		expect(deriveOptionCatalogFrom([list('dotted_name', '.', 'none')])).toEqual([]);
		const withTrailing = deriveOptionCatalogFrom([list('union_pattern', '|', 'optional')]);
		expect(withTrailing).toEqual([
			{
				key: 'union_pattern',
				family: 'list',
				kind: 'union_pattern',
				index: 0,
				values: [],
				defaultValue: 'tight',
				trailing: true
			}
		]);
	});

	it('an unseparated repeat slot is a join keyed kind_slot', () => {
		const block: CatalogNode = {
			kind: 'statement_block',
			slots: [{ fieldName: 'statements', values: [{ multiplicity: 'array', kind: 'statement' }] }]
		};
		expect(deriveOptionCatalogFrom([block])).toEqual([
			{
				key: 'statement_block_statements',
				family: 'join',
				kind: 'statement_block',
				slot: 'statements',
				index: 0,
				values: ['tight', 'space', 'newline'],
				defaultValue: 'tight',
				valueKinds: { space: '_space', newline: '_newline' }
			}
		]);
	});

	it('a repeat slot that carries its own separator is not a join', () => {
		const node: CatalogNode = {
			kind: 'parameters',
			slots: [{ fieldName: 'parameters', values: [{ multiplicity: 'array', kind: 'parameter', separator: ',' }] }]
		};
		expect(deriveOptionCatalogFrom([node])).toEqual([]);
	});

	it('a declared preference is a choice keyed by its label, with every site that carries it', () => {
		const terminator = (kind: string): CatalogNode => ({
			kind,
			slots: [
				{
					fieldName: 'terminator',
					values: [
						{ multiplicity: 'single', kind: 'automatic_semicolon', preferenceLabel: 'statement_terminator' },
						{
							multiplicity: 'single',
							kind: 'semi',
							literal: ';',
							preferenceLabel: 'statement_terminator',
							default: true
						}
					]
				}
			]
		});
		const entries = deriveOptionCatalogFrom([terminator('return_statement'), terminator('throw_statement')]);
		expect(entries).toEqual([
			{
				key: 'statement_terminator',
				family: 'choice',
				kind: 'return_statement',
				slot: 'terminator',
				index: 0,
				values: ['automatic_semicolon', ';'],
				defaultValue: ';',
				valueKinds: { automatic_semicolon: 'automatic_semicolon', ';': 'semi' },
				sites: ['return_statement.terminator', 'throw_statement.terminator']
			}
		]);
	});

	it('a form split labelled on the split kind is keyed by the label, valued by form', () => {
		const parent: CatalogNode = {
			kind: 'string',
			slots: [
				{
					fieldName: 'content',
					values: [
						{
							multiplicity: 'single',
							kind: 'string_double',
							variant: 'double',
							variantOf: 'string',
							preferenceLabel: 'quote_style',
							default: true
						},
						{
							multiplicity: 'single',
							kind: 'string_single',
							variant: 'single',
							variantOf: 'string',
							preferenceLabel: 'quote_style'
						}
					]
				}
			]
		};
		expect(deriveOptionCatalogFrom([parent])).toEqual([
			{
				key: 'quote_style',
				family: 'choice',
				kind: 'string',
				slot: 'content',
				index: 0,
				values: ['double', 'single'],
				defaultValue: 'double',
				valueKinds: { double: 'string_double', single: 'string_single' },
				sites: ['string.content']
			}
		]);
	});

	it('a semantic default alone is not an option', () => {
		const clause: CatalogNode = {
			kind: 'impl_item',
			slots: [
				{
					fieldName: 'trait_clause',
					values: [
						{ multiplicity: 'optional', kind: 'impl_item_positive_clause', default: true },
						{ multiplicity: 'optional', kind: 'impl_item_negative_clause' }
					]
				}
			]
		};
		expect(deriveOptionCatalogFrom([clause])).toEqual([]);
	});

	it('an unlabelled extra arm beside a labelled choice stays outside the preference', () => {
		const member: CatalogNode = {
			kind: 'class_body_member',
			slots: [
				{
					fieldName: 'terminator',
					values: [
						{ multiplicity: 'single', kind: 'automatic_semicolon', preferenceLabel: 'statement_terminator' },
						{
							multiplicity: 'single',
							kind: 'semi',
							literal: ';',
							preferenceLabel: 'statement_terminator',
							default: true
						},
						{ multiplicity: 'single', literal: ',' }
					]
				}
			]
		};
		const [entry] = deriveOptionCatalogFrom([member]);
		expect(entry).toMatchObject({
			key: 'statement_terminator',
			values: ['automatic_semicolon', ';'],
			defaultValue: ';'
		});
	});

	it('one label with differing arms across sites fails loudly', () => {
		const a: CatalogNode = {
			kind: 'a',
			slots: [
				{ fieldName: 't', values: [{ multiplicity: 'single', literal: ';', preferenceLabel: 'x', default: true }] }
			]
		};
		const b: CatalogNode = {
			kind: 'b',
			slots: [
				{ fieldName: 't', values: [{ multiplicity: 'single', literal: ',', preferenceLabel: 'x', default: true }] }
			]
		};
		expect(() => deriveOptionCatalogFrom([a, b])).toThrow(/preference 'x' differs/);
	});

	it('a hidden kind is addressed by its visible name', () => {
		expect(publicKindName('_arguments_elements')).toBe('arguments_elements');
		expect(publicKindName('arguments')).toBe('arguments');
	});

	it('two entries with one key fail loudly', () => {
		expect(() => deriveOptionCatalogFrom([list('types', ',', 'optional'), list('types', ';', 'optional')])).toThrow(
			/share the key 'types'/
		);
	});

	it('indices are dense and follow key order', () => {
		const entries = deriveOptionCatalogFrom([
			list('zeta_elements', ',', 'optional'),
			list('alpha_elements', ',', 'optional')
		]);
		expect(entries.map((e) => [e.key, e.index])).toEqual([
			['alpha_elements', 0],
			['zeta_elements', 1]
		]);
	});
});

describe('renderOptionsModule', () => {
	it('emits the interface, the catalog and the name tables', () => {
		const src = renderOptionsModule(
			deriveOptionCatalogFrom([
				list('arguments_elements', ',', 'optional'),
				{
					kind: 'return_statement',
					slots: [
						{
							fieldName: 'terminator',
							values: [
								{ multiplicity: 'single', kind: 'automatic_semicolon', preferenceLabel: 'statement_terminator' },
								{ multiplicity: 'single', literal: ';', preferenceLabel: 'statement_terminator', default: true }
							]
						}
					]
				}
			])
		);
		expect(src).toContain('export interface Options {');
		expect(src).toContain(
			"\treadonly arguments_elements?: { readonly separator?: 'tight' | 'space' | 'newline'; readonly trailing?: 'never' | 'always' | 'preserve'; };"
		);
		expect(src).toContain("\treadonly statement_terminator?: 'automatic_semicolon' | ';';");
		expect(src).toContain('\treadonly indent?: string;');
		expect(src).toContain('export const OPTION_CATALOG = [');
		expect(src).toContain("key: 'arguments_elements'");
		expect(src).toContain('] as const satisfies readonly OptionEntry[];');
	});
});
