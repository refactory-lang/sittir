/**
 * builders.test-d.ts — compile-time contract for the phase-typed builders.
 *
 * `StructuralBuilder` narrows each construction to the rule node it builds;
 * `AttributeBuilder` preserves the refined input type where it only stamps
 * attributes, and deliberately WIDENS where flattening rebuilds the node
 * (a SEQ under repeat/optional). Executed by `tsc -p packages/codegen`
 * (vitest excludes `*.test-d.ts` from runtime).
 */
import { describe, it, expectTypeOf } from 'vitest';
import { structuralBuilder, attributeBuilder } from '../builders.ts';
import type { Rule, SeqRule, ChoiceRule, FieldRule, AliasRule, StringRule, SymbolRule } from '../../types/rule.ts';

const evalSym = { type: 'SYMBOL', name: 'x' } as unknown as SymbolRule<'evaluate'>;
const builtString = { type: 'STRING', value: 'x' } as unknown as StringRule<'normalize'>;
const builtSym = { type: 'SYMBOL', name: 'x' } as unknown as SymbolRule<'normalize'>;
const builtSeq = { type: 'SEQ', members: [] } as unknown as SeqRule<'normalize'>;

describe('StructuralBuilder narrows to the constructed node', () => {
	it('seq → SeqRule, field → FieldRule, alias → AliasRule', () => {
		expectTypeOf(structuralBuilder.seq(evalSym)).toEqualTypeOf<SeqRule<'evaluate'>>();
		expectTypeOf(structuralBuilder.field('n', evalSym)).toEqualTypeOf<FieldRule<'evaluate'>>();
		expectTypeOf(structuralBuilder.alias(evalSym, 'v')).toEqualTypeOf<AliasRule<'evaluate'>>();
	});
});

describe('AttributeBuilder preserves refined inputs where it only stamps', () => {
	it('field/alias/token return the input type', () => {
		expectTypeOf(attributeBuilder.field('n', builtString)).toEqualTypeOf<StringRule<'normalize'>>();
		expectTypeOf(attributeBuilder.alias(builtSym, 'v')).toEqualTypeOf<SymbolRule<'normalize'>>();
		expectTypeOf(attributeBuilder.token(builtString)).toEqualTypeOf<StringRule<'normalize'>>();
	});

	it('choice narrows to ChoiceRule; repeat/optional over a SEQ widen (flatten rebuilds it)', () => {
		expectTypeOf(attributeBuilder.choice(builtSym)).toEqualTypeOf<ChoiceRule<'normalize'>>();
		expectTypeOf(attributeBuilder.repeat(builtSeq)).toEqualTypeOf<Rule<'normalize'>>();
		expectTypeOf(attributeBuilder.optional(builtSeq)).toEqualTypeOf<Rule<'normalize'>>();
	});
});
