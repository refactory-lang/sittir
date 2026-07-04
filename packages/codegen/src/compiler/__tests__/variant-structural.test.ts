import { describe, expect, it } from 'vitest';
import {
	deriveStructuralVariantChildren,
	findStructuralVariantChoices,
	prefixNamedSuffix
} from '../variant-structural.ts';
import type { Rule } from '../../types/rule.ts';

/**
 * R12/decision-7 V1 — unit coverage for the REFINED structural predicate
 * (`isAliasMintedRef`, added post-V0 to exclude coincidental prefix-name
 * collisions with ordinary sibling rules — see the module's own doc and
 * docs/superpowers/specs/2026-07-04-variant-structural-derivation-research.md
 * "V1 OUTCOME"). Small synthetic `Rule<'link'>` fixtures per class — no real
 * grammar loading; the 3-grammar equality check lives in
 * `packages/tools/src/probe/variant-derivation.ts`, not here.
 */

// ---------------------------------------------------------------------------
// Fixture builders — minimal Rule<'link'> shapes, matching the sibling
// link-content-alias.test.ts convention (cast through `unknown` where the
// full RuleBase intersection isn't needed for the predicate under test).
// ---------------------------------------------------------------------------

const sym = (name: string, extra?: Record<string, unknown>): Rule<'link'> =>
	({ type: 'SYMBOL', name, ...extra }) as unknown as Rule<'link'>;

/** A SYMBOL ref carrying `aliasedFrom` — the post-link form of a resolved `alias()` call. */
const aliasedSym = (name: string, aliasedFrom: string): Rule<'link'> => sym(name, { aliasedFrom });

const str = (value: string): Rule<'link'> => ({ type: 'STRING', value }) as unknown as Rule<'link'>;
const seq = (...members: Rule<'link'>[]): Rule<'link'> => ({ type: 'SEQ', members }) as unknown as Rule<'link'>;
const choice = (...members: Rule<'link'>[]): Rule<'link'> => ({ type: 'CHOICE', members }) as unknown as Rule<'link'>;
const optional = (content: Rule<'link'>): Rule<'link'> => ({ type: 'OPTIONAL', content }) as unknown as Rule<'link'>;
const field = (name: string, content: Rule<'link'>): Rule<'link'> =>
	({ type: 'FIELD', name, content }) as unknown as Rule<'link'>;

describe('prefixNamedSuffix', () => {
	it('matches a visible parent + visible target', () => {
		expect(prefixNamedSuffix('array_expression', 'array_expression_semi')).toBe('semi');
	});

	it('matches a HIDDEN parent whose target strips its OWN leading underscore (RESOLUTION 3)', () => {
		// `_export_statement_default` -> `export_statement_default_from_arm`:
		// polymorphVisibleName strips the PARENT's `_`; the target here is
		// already visible (no leading `_` of its own).
		expect(prefixNamedSuffix('_export_statement_default', 'export_statement_default_from_arm')).toBe('from_arm');
	});

	it('matches a HIDDEN parent with a HIDDEN target (target strips its own `_` before comparison)', () => {
		expect(prefixNamedSuffix('_simple_pattern', '_simple_pattern_negative')).toBe('negative');
	});

	it('returns null for a non-prefixed name', () => {
		expect(prefixNamedSuffix('dictionary', 'pair')).toBeNull();
	});

	it('returns null when the suffix would be empty (exact name match, no suffix)', () => {
		expect(prefixNamedSuffix('foo', 'foo_')).toBeNull();
		expect(prefixNamedSuffix('foo', 'foo')).toBeNull();
	});
});

describe('findStructuralVariantChoices — prefix-named + alias-minted arm detection', () => {
	it('qualifies a bare aliased SYMBOL arm that is BOTH prefix-named and alias-minted (no independent body)', () => {
		const rules: Record<string, Rule<'link'>> = {
			array_expression: seq(
				str('['),
				choice(aliasedSym('array_expression_semi', '_array_expression_semi'), aliasedSym('array_expression_list', '_array_expression_list')),
				str(']')
			)
			// Neither target has its own top-level entry in `rules` — alias-minted.
		};
		const found = findStructuralVariantChoices('array_expression', rules.array_expression!, rules);
		expect(found).toHaveLength(1);
		expect(found[0]!.arms.map((a) => a.suffix)).toEqual(['semi', 'list']);
		expect(found[0]!.arms.map((a) => a.targetName)).toEqual(['array_expression_semi', 'array_expression_list']);
	});

	it('excludes a prefix-named arm whose target has an INDEPENDENT rule body — the dictionary/dictionary_splat false-positive class', () => {
		const rules: Record<string, Rule<'link'>> = {
			// `dictionary`'s naked-entries choice: `pair` and `dictionary_splat`
			// are both ordinary, independently-authored sibling rules (plain
			// SYMBOL refs, no `aliasedFrom`) — `dictionary_splat` merely shares
			// dictionary's name prefix by coincidence.
			dictionary: seq(str('{'), field('entries', choice(sym('pair'), sym('dictionary_splat'))), str('}')),
			pair: seq(sym('key'), str(':'), sym('value')),
			dictionary_splat: seq(str('**'), sym('expr'))
		};
		const found = findStructuralVariantChoices('dictionary', rules.dictionary!, rules);
		expect(found).toHaveLength(0);
	});

	it('excludes a prefix-named, alias-like SYMBOL when the SAME name also has an independent body (mint condition is body-presence, not aliasedFrom-presence)', () => {
		// A SYMBOL with no `aliasedFrom` at all, prefix-named, but its target
		// has its own rule entry (ts's object_type_content_comma/_semi shape —
		// plain named refs to real sibling rules, not alias() calls).
		const rules: Record<string, Rule<'link'>> = {
			object_type_content: choice(sym('object_type_content_comma'), sym('object_type_content_semi')),
			object_type_content_comma: seq(str(','), sym('member')),
			object_type_content_semi: seq(str(';'), sym('member')),
			member: str('x')
		};
		const found = findStructuralVariantChoices('object_type_content', rules.object_type_content!, rules);
		expect(found).toHaveLength(0);
	});

	it('an explicit ALIAS node is unconditionally alias-minted (no independent-body check needed)', () => {
		const rules: Record<string, Rule<'link'>> = {
			impl_item: choice(
				{ type: 'ALIAS', content: sym('_impl_item_body'), named: true, value: 'impl_item_body' } as unknown as Rule<'link'>,
				{ type: 'ALIAS', content: sym('_impl_item_semi'), named: true, value: 'impl_item_semi' } as unknown as Rule<'link'>
			)
		};
		const found = findStructuralVariantChoices('impl_item', rules.impl_item!, rules);
		expect(found).toHaveLength(1);
		expect(found[0]!.arms.map((a) => a.targetName)).toEqual(['impl_item_body', 'impl_item_semi']);
	});

	it('ignores non-qualifying sibling arms (unrelated bare symbol, literal) without failing the whole choice — ANY-match semantics', () => {
		// visibility_modifier shape: `crate` (unrelated keyword symbol) beside
		// `visibility_modifier_pub` (alias-minted, prefix-named).
		const rules: Record<string, Rule<'link'>> = {
			visibility_modifier: choice(sym('crate'), aliasedSym('visibility_modifier_pub', '_visibility_modifier_pub')),
			crate: str('crate')
		};
		const found = findStructuralVariantChoices('visibility_modifier', rules.visibility_modifier!, rules);
		expect(found).toHaveLength(1);
		expect(found[0]!.arms).toHaveLength(1);
		expect(found[0]!.arms[0]!.suffix).toBe('pub');
	});

	it('recurses into NESTED choices found anywhere in the rule tree (decision-1 nested-choice case)', () => {
		// range_pattern shape: a top-level choice whose FIRST arm is a SEQ
		// containing its OWN nested qualifying choice (not itself qualifying
		// at the top level), and whose SECOND arm directly qualifies.
		const rules: Record<string, Rule<'link'>> = {
			range_pattern: choice(
				seq(
					field(
						'left',
						choice(
							aliasedSym('range_pattern_left_with_right', '_range_pattern_left_with_right'),
							aliasedSym('range_pattern_left_bare', '_range_pattern_left_bare')
						)
					)
				),
				aliasedSym('range_pattern_prefix', '_range_pattern_prefix')
			)
		};
		const found = findStructuralVariantChoices('range_pattern', rules.range_pattern!, rules);
		// Two qualifying choices: the OUTER (arm 1 = prefix) and the NESTED one
		// inside arm 0's field content (left_with_right / left_bare).
		expect(found).toHaveLength(2);
		const allSuffixes = found.flatMap((c) => c.arms.map((a) => a.suffix)).sort();
		expect(allSuffixes).toEqual(['left_bare', 'left_with_right', 'prefix']);
	});

	it('recurses into a SEQ-first-member reference (the function_type shape: alias-then-shared-suffix-content)', () => {
		const rules: Record<string, Rule<'link'>> = {
			function_type: choice(
				seq(aliasedSym('function_type_trait_form', '_function_type_trait_form'), field('parameters', sym('parameters'))),
				seq(aliasedSym('function_type_fn_form', '_function_type_fn_form'), field('parameters', sym('parameters')))
			),
			parameters: str('()')
		};
		const found = findStructuralVariantChoices('function_type', rules.function_type!, rules);
		expect(found).toHaveLength(1);
		expect(found[0]!.arms.map((a) => a.suffix)).toEqual(['trait_form', 'fn_form']);
	});

	it('admits a HIDDEN target name as a qualifying arm (RESOLUTION 3)', () => {
		// A hidden parent whose alias-minted target is ALSO hidden.
		const rules: Record<string, Rule<'link'>> = {
			_simple_pattern_helper: choice(sym('class_pattern'), aliasedSym('_simple_pattern_helper_negative', '__simple_pattern_helper_negative')),
			class_pattern: str('class')
		};
		const found = findStructuralVariantChoices('_simple_pattern_helper', rules._simple_pattern_helper!, rules);
		expect(found).toHaveLength(1);
		expect(found[0]!.arms[0]!.suffix).toBe('negative');
	});

	it('unwraps an OPTIONAL wrapper around an alias-minted arm (optionality does not change what the arm names)', () => {
		const rules: Record<string, Rule<'link'>> = {
			mod_item: choice(optional(aliasedSym('mod_item_external', '_mod_item_external')), sym('declaration_list'))
		};
		const found = findStructuralVariantChoices('mod_item', rules.mod_item!, rules);
		expect(found).toHaveLength(1);
		expect(found[0]!.arms[0]!.suffix).toBe('external');
	});
});

describe('deriveStructuralVariantChildren — grammar-wide map, full target names, de-duplication', () => {
	it('returns FULL target names (not bare suffixes) — required for a hidden parent with a visible target', () => {
		const rules: Record<string, Rule<'link'>> = {
			_export_statement_default: choice(
				aliasedSym('export_statement_default_from_arm', '_export_statement_default_from_arm_hidden'),
				aliasedSym('export_statement_default_decl_arm', '_export_statement_default_decl_arm_hidden')
			)
		};
		const map = deriveStructuralVariantChildren(rules);
		expect(map.get('_export_statement_default')).toEqual([
			'export_statement_default_from_arm',
			'export_statement_default_decl_arm'
		]);
	});

	it('de-duplicates the same alias-minted target appearing as more than one arm (ts string_fragment: two quote-style branches, one child kind)', () => {
		const rules: Record<string, Rule<'link'>> = {
			string: choice(
				seq(str('"'), field('contents', choice(aliasedSym('string_fragment', 'unescaped_double_string_fragment'), sym('escape_sequence')))),
				seq(str("'"), field('contents', choice(aliasedSym('string_fragment', 'unescaped_single_string_fragment'), sym('escape_sequence'))))
			),
			escape_sequence: str('\\\\')
		};
		const map = deriveStructuralVariantChildren(rules);
		expect(map.get('string')).toEqual(['string_fragment']);
	});

	it('a kind with no qualifying choice is absent from the map entirely (not an empty array)', () => {
		const rules: Record<string, Rule<'link'>> = {
			plain_kind: seq(str('a'), sym('b')),
			b: str('b')
		};
		const map = deriveStructuralVariantChildren(rules);
		expect(map.has('plain_kind')).toBe(false);
	});

	it('excludes the SAME coincidental-collision class at the grammar-wide derivation level (not just per-choice)', () => {
		const rules: Record<string, Rule<'link'>> = {
			string: seq(field('content', choice(sym('interpolation'), sym('string_content')))),
			interpolation: str('${}'),
			string_content: str('text')
		};
		const map = deriveStructuralVariantChildren(rules);
		expect(map.has('string')).toBe(false);
	});
});
