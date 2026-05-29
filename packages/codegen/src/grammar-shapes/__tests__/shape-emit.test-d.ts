/**
 * shape-emit.test-d.ts — proves the `as const satisfies GrammarJson` emit
 * preserves literals + tuples (discriminants, rule names, positional
 * indices) rather than widening to string / any[].
 */
import { describe, it, expectTypeOf } from 'vitest';
import type { RustGrammarShape } from '../grammar-shape.rust.ts';
import type { GrammarJson, MutableDeep } from '../grammar-json.ts';

describe('grammar-shape emit literal/tuple preservation', () => {
	type Rules = RustGrammarShape['rules'];
	type BinExpr = Rules['binary_expression'];

	it('rule names survive as literal keys', () => {
		// If widened to Record<string, _>, indexing an arbitrary key would
		// not error; here the key set is the literal union.
		expectTypeOf<keyof Rules>().toExtend<string>();
		expectTypeOf<'binary_expression'>().toExtend<keyof Rules>();
	});

	it('node type discriminant survives as a literal, not string', () => {
		expectTypeOf<BinExpr['type']>().toEqualTypeOf<'CHOICE'>();
	});

	it('members import as a positional tuple, not any[]', () => {
		type Members = (BinExpr & { type: 'CHOICE' })['members'];
		// A tuple has a numeric literal length; an array would be `number`.
		expectTypeOf<Members['length']>().not.toEqualTypeOf<number>();
		// Member 0 is the first PREC_LEFT branch — addressable positionally.
		expectTypeOf<Members[0]['type']>().toEqualTypeOf<'PREC_LEFT'>();
	});

	it('STRING values survive as literals', () => {
		// await_expression seq: [_expression, '.', 'await'] under PREC.
		type Await = Rules['await_expression'];
		expectTypeOf<Await['type']>().toEqualTypeOf<'PREC'>();
	});

	it('subtyping ladder: MutableDeep<GrammarJson> ⊑ tree-sitter GrammarSchema<string>', () => {
		// GrammarJson can't extend GrammarSchema<string> directly (its readonly
		// containers aren't ⊑ the mutable `Rule`). MutableDeep<> strips readonly
		// recursively, proving structural compatibility modulo readonly — the
		// "single vocabulary, refined" claim. `RustGrammarShape` itself also
		// flows up through this bridge.
		expectTypeOf<MutableDeep<GrammarJson>>().toExtend<GrammarSchema<string>>();
		expectTypeOf<MutableDeep<RustGrammarShape>>().toExtend<GrammarSchema<string>>();
	});

	it('SYMBOL leaf reuses tree-sitter SymbolRule (single vocabulary)', () => {
		// reference_type member 3 = field('type', $._type); its content is a
		// SYMBOL that IS tree-sitter's SymbolRule<'_type'> (composes in seq()).
		type RefMembers = (Rules['reference_type'] & { members: readonly unknown[] })['members'];
		type TypeField = RefMembers[3];
		type Content = (TypeField & { content: unknown })['content'];
		expectTypeOf<Content>().toExtend<SymbolRule<string>>();
	});
});
