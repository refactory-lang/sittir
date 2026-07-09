/**
 * intellisense-demo.test-d.ts — SCRATCH demonstration that the derived
 * (post-Enrich) rule shapes give authoring IntelliSense.
 * This is a PROOF artifact, not wired into the real overrides.ts.
 *
 *   B-half: direct rule-shape navigation (hover/navigate a rule's recursive
 *           structure) — `EnrichRule<RawShape['rule']>` is a fully-resolved,
 *           navigable type with literal discriminants + field names.
 *
 * First-segment path autocomplete (`TopLevelKeys<Shape>` / `PathKey<Shape>`)
 * is exercised below too — segment-1 indices/keys for a rule's top-level
 * members.
 */
import { describe, it, expectTypeOf, assertType } from 'vitest';
import { rustGrammarShape } from '../grammar-shape.rust.ts';
import type { EnrichRule } from '../enrich-type.ts';
import type { PathKey, TopLevelKeys } from '../path-type.ts';

type Rules = (typeof rustGrammarShape)['rules'];

// Post-enrich rule shapes (what a transform's `original` actually sees).
type AwaitExpr = EnrichRule<Rules['await_expression']>;
type ReferenceType = EnrichRule<Rules['reference_type']>;
type OrPattern = EnrichRule<Rules['or_pattern']>;

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

describe('first-segment path autocomplete validated against rule shape', () => {
	it('first-segment autocomplete: TopLevelKeys / PathKey offer the rule indices', () => {
		// or_pattern (PREC>CHOICE with 2 arms): top-level keys are '0' | '1'.
		expectTypeOf<TopLevelKeys<OrPattern>>().toEqualTypeOf<'0' | '1'>();
		// PathKey accepts the bare first segment and any `${first}/...` tail.
		assertType<PathKey<OrPattern>>('0');
		assertType<PathKey<OrPattern>>('1/1');
		// @ts-expect-error — '7' is not a valid first segment for a 2-arm choice.
		const _bad: PathKey<OrPattern> = '7';
		void _bad;
	});
});
