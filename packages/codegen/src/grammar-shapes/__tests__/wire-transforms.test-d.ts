import { describe, it, expectTypeOf } from 'vitest';
import type { RustGrammarShape } from '../grammar-shape.rust.ts';
import type { EnrichRule } from '../enrich-type.ts';
import type { EnrichedGrammar } from '../../dsl/enrich.ts';
import type { IsPath } from '../path-type.ts';
import type { IsPreferencePath } from '../../dsl/primitives/preference-path.ts';
import { wire } from '../../dsl/wire/wire.ts';
import { field, variant, preference } from '../../dsl/index.ts';

type Rules = RustGrammarShape['rules'];
type R<K extends keyof Rules> = EnrichRule<Rules[K]>;

declare const enriched: EnrichedGrammar<RustGrammarShape>;

describe('IsPath accepts what applyPath walks and rejects what it throws on', () => {
	it('index and negative index on a sequence are bounds-checked', () => {
		expectTypeOf<IsPath<R<'parameter'>, '1'>>().toEqualTypeOf<true>();
		expectTypeOf<IsPath<R<'parameter'>, '-1'>>().toEqualTypeOf<true>();
		expectTypeOf<IsPath<R<'parameter'>, '9'>>().toEqualTypeOf<false>();
		expectTypeOf<IsPath<R<'parameter'>, '-9'>>().toEqualTypeOf<false>();
	});

	it('a choice arity is a lower bound: enrich can distribute more arms onto it', () => {
		expectTypeOf<IsPath<R<'or_pattern'>, '0/0'>>().toEqualTypeOf<true>();
		expectTypeOf<IsPath<R<'or_pattern'>, '1/1'>>().toEqualTypeOf<true>();
		expectTypeOf<IsPath<R<'or_pattern'>, '1/9'>>().toEqualTypeOf<false>();
		expectTypeOf<IsPath<R<'line_comment'>, '1/3'>>().toEqualTypeOf<true>();
		expectTypeOf<IsPath<R<'line_comment'>, '1/3/0/anything'>>().toEqualTypeOf<true>();
	});

	it('wildcard descends into every member and needs one to accept the rest', () => {
		expectTypeOf<IsPath<R<'function_modifiers'>, '_'>>().toEqualTypeOf<true>();
		expectTypeOf<IsPath<R<'or_pattern'>, '_/1'>>().toEqualTypeOf<true>();
		expectTypeOf<IsPath<R<'or_pattern'>, '_/9'>>().toEqualTypeOf<false>();
	});

	it('a field segment names the field wrapper it sits on', () => {
		expectTypeOf<IsPath<R<'await_expression'>, '0/expression:'>>().toEqualTypeOf<true>();
		expectTypeOf<IsPath<R<'await_expression'>, '0/nope:'>>().toEqualTypeOf<false>();
		expectTypeOf<IsPath<R<'await_expression'>, 'expression:'>>().toEqualTypeOf<false>();
	});

	it('a literal segment names a string member', () => {
		expectTypeOf<IsPath<R<'await_expression'>, '"."'>>().toEqualTypeOf<true>();
		expectTypeOf<IsPath<R<'await_expression'>, '"!"'>>().toEqualTypeOf<false>();
	});

	it('a kind match finds a symbol anywhere below, except under a field', () => {
		expectTypeOf<IsPath<R<'or_pattern'>, '(_pattern)'>>().toEqualTypeOf<true>();
		expectTypeOf<IsPath<R<'or_pattern'>, '(_expression)'>>().toEqualTypeOf<false>();
		expectTypeOf<IsPath<R<'await_expression'>, '(_expression)'>>().toEqualTypeOf<false>();
	});

	it('a deep authored path resolves', () => {
		expectTypeOf<IsPath<R<'visibility_modifier'>, '1/1/0/1/3/0'>>().toEqualTypeOf<true>();
	});
});

describe('wire() checks patch keys per rule, from the base it is given', () => {
	it('accepts authored keys, alone and in the array form, beside rule callbacks', () => {
		wire({ name: 'rust', patches: { parameter: { '1': field('name') } } }, enriched);
		wire({ name: 'rust', patches: { or_pattern: [{ '0/0': field('left') }, { '0': variant('binary') }] } }, enriched);
		wire(
			{
				name: 'rust',
				rules: { parameter: ($, previous) => previous },
				patches: { parameter: { '1': field('name') } }
			},
			enriched
		);
	});

	it('rejects a key the walker would throw on', () => {
		// @ts-expect-error — parameter has no member 9
		wire({ name: 'rust', patches: { parameter: { '9': field('name') } } }, enriched);
		// @ts-expect-error — the second patch set names a member or_pattern's arm 1 lacks
		wire({ name: 'rust', patches: { or_pattern: [{ '0/0': field('left') }, { '1/9': variant('x') }] } }, enriched);
	});

	it('an unshaped base checks nothing', () => {
		wire({ name: 'loose', patches: { anything: { '99/99': field('x') } } });
	});
});

describe('wire() checks the options block', () => {
	it('accepts paths, declarations and bindings that resolve', () => {
		wire(
			{
				name: 'rust',
				options: {
					body: { before: preference('indent'), after: preference('dedent') },
					block: { '"{"/after': preference('space'), 'statements:/(_)/after': preference('newline') },
					_: { '_/separator/","/before': preference('tight'), '"/="/after': preference('space') },
					_bindings: { 'block/"{"/after': 'body/before' }
				}
			},
			enriched
		);
	});

	it('rejects a binding whose label is not declared', () => {
		wire(
			{
				name: 'rust',
				options: {
					body: { before: preference('indent') },
					// @ts-expect-error — body/after is declared nowhere
					_bindings: { 'block/"{"/after': 'body/after' }
				}
			},
			enriched
		);
	});

	it('rejects a label rooted at a real kind', () => {
		wire(
			{
				name: 'rust',
				options: {
					block: { before: preference('space') },
					// @ts-expect-error — block is a rule of the grammar, a label's kind is virtual
					_bindings: { 'match_block/before': 'block/before' }
				}
			},
			enriched
		);
	});

	it('rejects a key that is not a path', () => {
		// @ts-expect-error — a segment may not hold a space
		wire({ name: 'rust', options: { block: { 'a b/after': preference('space') } } }, enriched);
	});
});

describe('IsPreferencePath mirrors parsePreferencePath', () => {
	it('admits every segment form', () => {
		expectTypeOf<IsPreferencePath<'statements:/(_)/after'>>().toEqualTypeOf<true>();
		expectTypeOf<IsPreferencePath<'_/separator/","/before'>>().toEqualTypeOf<true>();
		expectTypeOf<IsPreferencePath<'"/="/after'>>().toEqualTypeOf<true>();
		expectTypeOf<IsPreferencePath<'-1/0/before'>>().toEqualTypeOf<true>();
	});

	it('refuses an empty segment or punctuation in a bare one', () => {
		expectTypeOf<IsPreferencePath<''>>().toEqualTypeOf<false>();
		expectTypeOf<IsPreferencePath<'block/'>>().toEqualTypeOf<false>();
		expectTypeOf<IsPreferencePath<'a b'>>().toEqualTypeOf<false>();
		expectTypeOf<IsPreferencePath<'(:)/after'>>().toEqualTypeOf<false>();
	});
});
