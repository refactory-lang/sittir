import { describe, expect, it } from 'vitest';
import { deriveOptionCatalogFrom, renderOptionsModule, type CatalogNode } from '../options.ts';

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

	it('a slot with a declared default arm is a choice keyed kind_slot, valued by arm', () => {
		const stmt: CatalogNode = {
			kind: 'return_statement',
			slots: [
				{
					fieldName: 'terminator',
					values: [
						{ multiplicity: 'single', kind: 'automatic_semicolon' },
						{ multiplicity: 'single', literal: ';', default: true }
					]
				}
			]
		};
		expect(deriveOptionCatalogFrom([stmt])).toEqual([
			{
				key: 'return_statement_terminator',
				family: 'choice',
				kind: 'return_statement',
				slot: 'terminator',
				index: 0,
				values: ['automatic_semicolon', ';'],
				defaultValue: ';'
			}
		]);
	});

	it('a slot with a closed choice but no declared default is not an option', () => {
		const expr: CatalogNode = {
			kind: 'binary_expression',
			slots: [
				{
					fieldName: 'operator',
					values: [
						{ multiplicity: 'single', literal: '+' },
						{ multiplicity: 'single', literal: '-' }
					]
				}
			]
		};
		expect(deriveOptionCatalogFrom([expr])).toEqual([]);
	});

	it('a root-level form split is keyed by the slot its arms share, valued by form', () => {
		const parent: CatalogNode = {
			kind: 'string',
			slots: [
				{
					fieldName: 'content',
					values: [
						{ multiplicity: 'single', kind: 'string_double', variant: 'double', variantOf: 'string', default: true },
						{ multiplicity: 'single', kind: 'string_single', variant: 'single', variantOf: 'string' }
					]
				}
			]
		};
		const dbl: CatalogNode = {
			kind: 'string_double',
			slots: [
				{ fieldName: 'quote', values: [{ multiplicity: 'single', literal: '"' }] },
				{ fieldName: 'elements', values: [{ multiplicity: 'array', kind: 'fragment' }] }
			]
		};
		const sgl: CatalogNode = {
			kind: 'string_single',
			slots: [
				{ fieldName: 'quote', values: [{ multiplicity: 'single', literal: "'" }] },
				{ fieldName: 'elements', values: [{ multiplicity: 'array', kind: 'fragment' }] }
			]
		};
		const entries = deriveOptionCatalogFrom([parent, dbl, sgl]);
		expect(entries.filter((e) => e.family === 'choice')).toEqual([
			{
				key: 'string_quote',
				family: 'choice',
				kind: 'string',
				slot: 'quote',
				index: 1,
				values: ['double', 'single'],
				defaultValue: 'double',
				valueKinds: { double: 'string_double', single: 'string_single' }
			}
		]);
		expect(entries.map((e) => e.key)).toEqual(['string_double_elements', 'string_quote', 'string_single_elements']);
	});

	it('a root-level split whose arms share no discriminating slot yields no choice key', () => {
		const parent: CatalogNode = {
			kind: 'with_clause',
			slots: [
				{
					fieldName: 'content',
					values: [
						{
							multiplicity: 'single',
							kind: 'with_clause_bare',
							variant: 'bare',
							variantOf: 'with_clause',
							default: true
						},
						{ multiplicity: 'single', kind: 'with_clause_paren', variant: 'paren', variantOf: 'with_clause' }
					]
				}
			]
		};
		const bare: CatalogNode = {
			kind: 'with_clause_bare',
			slots: [{ fieldName: 'items', values: [{ multiplicity: 'array', kind: 'with_item' }] }]
		};
		const paren: CatalogNode = {
			kind: 'with_clause_paren',
			slots: [{ fieldName: 'items', values: [{ multiplicity: 'array', kind: 'with_item' }] }]
		};
		const entries = deriveOptionCatalogFrom([parent, bare, paren]);
		expect(entries.filter((e) => e.family === 'choice')).toEqual([]);
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
								{ multiplicity: 'single', kind: 'automatic_semicolon' },
								{ multiplicity: 'single', literal: ';', default: true }
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
		expect(src).toContain("\treadonly return_statement_terminator?: 'automatic_semicolon' | ';';");
		expect(src).toContain('\treadonly indent?: string;');
		expect(src).toContain('export const OPTION_CATALOG = [');
		expect(src).toContain("key: 'arguments_elements'");
		expect(src).toContain('] as const satisfies readonly OptionEntry[];');
	});
});
