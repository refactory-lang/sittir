/**
 * intellisense-demo.test-d.ts — SCRATCH demonstration that the derived
 * (post-Enrich) rule shapes give authoring IntelliSense for BOTH halves.
 * This is a PROOF artifact, not wired into the real overrides.ts.
 *
 *   B-half: direct rule-shape navigation (hover/navigate a rule's recursive
 *           structure) — `EnrichRule<RawShape['rule']>` is a fully-resolved,
 *           navigable type with literal discriminants + field names.
 *
 *   A-half: transform path-addressing — `NodeAtPath<Shape, '4/0'>` validates
 *           a path against the rule structure; out-of-bounds resolves to
 *           `never` (caught at compile time), and `PathKey<Shape>` gives
 *           first-segment autocomplete.
 *
 * Ground truth: the A-half paths used here are LIFTED VERBATIM from
 * packages/rust/overrides.ts (or_pattern, range_expression) — real authored
 * paths are the only ground truth that the post-enrich structure is the one
 * authors actually target.
 */
import { describe, it, expectTypeOf, assertType } from 'vitest';
import { rustGrammarShape } from '../grammar-shape.rust.ts';
import type { EnrichRule } from '../enrich-type.ts';
import type { NodeAtPath, IsValidPath, PathKey, TopLevelKeys } from '../path-type.ts';

type Rules = typeof rustGrammarShape['rules'];

// Post-enrich rule shapes (what a transform's `original` actually sees).
type AwaitExpr = EnrichRule<Rules['await_expression']>;
type ReferenceType = EnrichRule<Rules['reference_type']>;
type OrPattern = EnrichRule<Rules['or_pattern']>;
type RangeExpr = EnrichRule<Rules['range_expression']>;

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

describe('A-half: transform path-addressing validated against rule shape', () => {
	it('or_pattern: authored paths 0/0, 0/2, 1/1 resolve (lifted from overrides.ts)', () => {
		// '0/0' -> choice arm 0, seq pos 0 = SYMBOL _pattern (PREC transparent).
		assertType<IsValidPath<OrPattern, '0/0'>>(true);
		assertType<IsValidPath<OrPattern, '0/2'>>(true);
		assertType<IsValidPath<OrPattern, '1/1'>>(true);
		// The resolved node is the bare _pattern symbol authors wrap with field().
		type N00 = NodeAtPath<OrPattern, '0/0'>;
		expectTypeOf<(N00 & { type: string })['type']>().toEqualTypeOf<'SYMBOL'>();
		expectTypeOf<(N00 & { name: string })['name']>().toEqualTypeOf<'_pattern'>();
	});

	it('range_expression: authored deep paths resolve; nested CHOICE at 0/1', () => {
		assertType<IsValidPath<RangeExpr, '0/0'>>(true);
		assertType<IsValidPath<RangeExpr, '0/2'>>(true);
		assertType<IsValidPath<RangeExpr, '2/1'>>(true);
		// '0/1' is the inner CHOICE('..','...','..=') (operator position).
		type Op = NodeAtPath<RangeExpr, '0/1'>;
		expectTypeOf<(Op & { type: string })['type']>().toEqualTypeOf<'CHOICE'>();
		// Deeper still: '0/1/0' = first operator literal '..'.
		assertType<IsValidPath<RangeExpr, '0/1/0'>>(true);
	});

	it('PREC transparency: await_expression path 0 reaches INTO the seq, not the prec', () => {
		// await_expression is PREC>SEQ. Path '0' skips PREC, lands on seq member 0 (the FIELD).
		type N0 = NodeAtPath<AwaitExpr, '0'>;
		expectTypeOf<(N0 & { type: string })['type']>().toEqualTypeOf<'FIELD'>();
	});

	it('FIELD opacity: descending into a field consumes a segment (path gained a level)', () => {
		// await_expression '0' = FIELD; '0/0' = the field CONTENT (the symbol).
		type N00 = NodeAtPath<AwaitExpr, '0/0'>;
		expectTypeOf<(N00 & { type: string })['type']>().toEqualTypeOf<'SYMBOL'>();
		expectTypeOf<(N00 & { name: string })['name']>().toEqualTypeOf<'_expression'>();
	});

	it('out-of-bounds paths are caught at compile time (resolve to never / false)', () => {
		// or_pattern choice has 2 arms (0,1). Arm 5 is out of bounds.
		assertType<IsValidPath<OrPattern, '5'>>(false);
		// arm 0 seq has 3 members (0,1,2). pos 9 out of bounds.
		assertType<IsValidPath<OrPattern, '0/9'>>(false);
		// @ts-expect-error — NodeAtPath<_, '5/0'> is `never`; assigning a real
		// node value to `never` is a compile error, proving the bad path is rejected.
		const _bad: NodeAtPath<OrPattern, '5/0'> = { type: 'SYMBOL', name: 'x' } as const;
		void _bad;
	});

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
