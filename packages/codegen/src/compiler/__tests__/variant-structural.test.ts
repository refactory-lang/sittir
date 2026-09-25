import { describe, expect, it } from 'vitest';
import { deriveVariantChildren, prefixNamedSuffix, variantChildrenOf } from '../variant-structural.ts';
import type { Rule } from '../../types/rule.ts';

const variantOf = (parent: string, variant: string) => ({ annotations: { variant, variantOf: parent } });

const sym = (name: string, extra?: Record<string, unknown>): Rule<'link'> =>
	({ type: 'SYMBOL', name, ...extra }) as unknown as Rule<'link'>;

const alias = (value: string, content: Rule<'link'>, extra?: Record<string, unknown>): Rule<'link'> =>
	({ type: 'ALIAS', named: true, value, content, ...extra }) as unknown as Rule<'link'>;

const str = (value: string): Rule<'link'> => ({ type: 'STRING', value }) as unknown as Rule<'link'>;
const seq = (...members: Rule<'link'>[]): Rule<'link'> => ({ type: 'SEQ', members }) as unknown as Rule<'link'>;
const choice = (...members: Rule<'link'>[]): Rule<'link'> => ({ type: 'CHOICE', members }) as unknown as Rule<'link'>;
const field = (name: string, content: Rule<'link'>): Rule<'link'> =>
	({ type: 'FIELD', name, content }) as unknown as Rule<'link'>;
const supertype = (name: string, ...subtypes: Rule<'link'>[]): Rule<'link'> =>
	({ type: 'SUPERTYPE', name, subtypes }) as unknown as Rule<'link'>;

describe('prefixNamedSuffix', () => {
	it('matches a visible parent + visible target', () => {
		expect(prefixNamedSuffix('array_expression', 'array_expression_semi')).toBe('semi');
	});

	it('strips a hidden parent before comparing', () => {
		expect(prefixNamedSuffix('_export_statement_default', 'export_statement_default_from_arm')).toBe('from_arm');
	});

	it('strips a hidden target before comparing', () => {
		expect(prefixNamedSuffix('_simple_pattern', '_simple_pattern_negative')).toBe('negative');
	});

	it('returns null for a non-prefixed name or an empty suffix', () => {
		expect(prefixNamedSuffix('dictionary', 'pair')).toBeNull();
		expect(prefixNamedSuffix('foo', 'foo_')).toBeNull();
		expect(prefixNamedSuffix('foo', 'foo')).toBeNull();
	});
});

describe('variantChildrenOf — variants come from the variant annotation only', () => {
	it('reads a symbol arm annotated as a variant of the parent', () => {
		const rule = choice(sym('assignment_eq', variantOf('assignment', 'eq')), sym('assignment_type', variantOf('assignment', 'type')));
		expect(variantChildrenOf('assignment', rule)).toEqual([
			{ kind: 'assignment_eq', name: 'eq', definedBy: 'override' },
			{ kind: 'assignment_type', name: 'type', definedBy: 'override' }
		]);
	});

	it('ignores a prefix-named arm with no variant annotation', () => {
		const rule = seq(str('yield'), sym('yield_from_clause'));
		expect(variantChildrenOf('yield', rule)).toEqual([]);
	});

	it('ignores an arm annotated as a variant of a different parent', () => {
		const rule = choice(sym('other_x', variantOf('other', 'x')), sym('parent_y', variantOf('parent', 'y')));
		expect(variantChildrenOf('parent', rule)).toEqual([{ kind: 'parent_y', name: 'y', definedBy: 'override' }]);
	});

	it('names an aliased arm by its visible value, with the annotation on the alias or its content', () => {
		const rule = choice(
			alias('crate', sym('crate'), variantOf('visibility_modifier', 'crate')),
			alias('visibility_modifier_pub', sym('_pub', variantOf('visibility_modifier', 'pub')))
		);
		expect(variantChildrenOf('visibility_modifier', rule)).toEqual([
			{ kind: 'crate', name: 'crate', definedBy: 'override' },
			{ kind: 'visibility_modifier_pub', name: 'pub', definedBy: 'override' }
		]);
	});

	it('finds variants nested under fields and sequences', () => {
		const rule = seq(str('impl'), field('trait_clause', choice(sym('impl_item_positive_clause', variantOf('impl_item', 'positive_clause')))));
		expect(variantChildrenOf('impl_item', rule)).toEqual([{ kind: 'impl_item_positive_clause', name: 'positive_clause', definedBy: 'override' }]);
	});

	it('walks a flattened parent\'s supertype subtypes', () => {
		const rule = supertype(
			'reference_expression',
			sym('reference_expression_raw_const', variantOf('reference_expression', 'raw_const')),
			sym('reference_expression_bare', variantOf('reference_expression', 'bare'))
		);
		expect(variantChildrenOf('reference_expression', rule)).toEqual([
			{ kind: 'reference_expression_raw_const', name: 'raw_const', definedBy: 'override' },
			{ kind: 'reference_expression_bare', name: 'bare', definedBy: 'override' }
		]);
	});

	it('lists a variant reached from several arms once', () => {
		const eq = sym('assignment_eq', variantOf('assignment', 'eq'));
		expect(variantChildrenOf('assignment', choice(seq(str('='), eq), seq(str(':='), eq)))).toEqual([{ kind: 'assignment_eq', name: 'eq', definedBy: 'override' }]);
	});
});

describe('deriveVariantChildren', () => {
	it('maps every parent with at least one variant and omits the rest', () => {
		const rules: Record<string, Rule<'link'>> = {
			string: choice(sym('string_double', variantOf('string', 'double')), sym('string_single', variantOf('string', 'single'))),
			identifier: str('x')
		};
		const map = deriveVariantChildren(rules);
		expect([...map.keys()]).toEqual(['string']);
		expect(map.get('string')).toEqual([
			{ kind: 'string_double', name: 'double', definedBy: 'override' },
			{ kind: 'string_single', name: 'single', definedBy: 'override' }
		]);
	});
});
