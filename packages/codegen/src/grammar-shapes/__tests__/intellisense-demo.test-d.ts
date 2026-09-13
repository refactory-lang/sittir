/**
 * intellisense-demo.test-d.ts — SCRATCH demonstration that the derived
 * (post-Enrich) rule shapes give authoring IntelliSense.
 * This is a PROOF artifact, not wired into the real grammar.sittir.ts.
 *
 *   B-half: direct rule-shape navigation (hover/navigate a rule's recursive
 *           structure) — `EnrichRule<RawShape['rule']>` is a fully-resolved,
 *           navigable type with literal discriminants + field names.
 */
import { describe, it, expectTypeOf } from 'vitest';
import { rustGrammarShape } from '../grammar-shape.rust.ts';
import type { EnrichRule } from '../enrich-type.ts';

type Rules = (typeof rustGrammarShape)['rules'];

// Post-enrich rule shapes (what a transform's `original` actually sees).
type AwaitExpr = EnrichRule<Rules['await_expression']>;
type ReferenceType = EnrichRule<Rules['reference_type']>;

describe('B-half: direct rule-shape navigation / IntelliSense', () => {
	it('await_expression resolves to a navigable PREC>SEQ with a named FIELD', () => {
		// Hovering AwaitExpr shows: PREC { content: SEQ { members: [
		//   FIELD<'expression', SYMBOL<'_expression'>>, '.', 'await' ] } }
		type Members = (AwaitExpr & { content: { members: readonly unknown[] } })['content']['members'];
		type Field0 = Members[0];
		expectTypeOf<(Field0 & { type: string })['type']>().toEqualTypeOf<'FIELD'>();
		// The enrich-inserted field name is statically known:
		expectTypeOf<(Field0 & { name: string })['name']>().toEqualTypeOf<'expression'>();
		// And the field's content symbol is navigable:
		expectTypeOf<(Field0 & { content: { name: string } })['content']['name']>().toEqualTypeOf<'_expression'>();
	});

	it('reference_type: navigating into the optional shows the enrich-inserted field', () => {
		// member 1 is CHOICE(FIELD<'lifetime'>, BLANK) — the field that
		// enrich INSERTED (raw had a bare SYMBOL there). Navigation reveals it.
		type M1Inner = (ReferenceType & { members: readonly any[] })['members'][1]['members'][0];
		expectTypeOf<(M1Inner & { name: string })['name']>().toEqualTypeOf<'lifetime'>();
	});
});
