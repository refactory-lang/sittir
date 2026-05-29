/**
 * wire-transforms.test-d.ts — proves the Phase-2 wiring decisions:
 *
 *  1. FastKeys ≡ PreciseKeys: `PathKey<EnrichRule<X>> ≡ PathKey<X>` for the
 *     transform key surface. `PathKey` only consumes the FIRST path segment
 *     (`TopLevelKeys`), and enrich wraps top-level members IN PLACE (never
 *     adds/removes one), so deriving keys from the RAW node is LOSSLESS —
 *     and avoids instantiating `EnrichRule` over the loose `GrammarNode`
 *     union (the TS2589 source). This is why TransformsConfig uses FastKeys.
 *
 *  2. The per-rule transform patch-map autocompletes real segment-1 keys and
 *     rejects out-of-bounds first segments (negative-controlled @ts-expect-error).
 */
import { describe, it, expectTypeOf, assertType } from 'vitest';
import { rustGrammarShape } from '../grammar-shape.rust.ts';
import type { EnrichRule } from '../enrich-type.ts';
import type { PathKey, FastKeys, PreciseKeys, TransformPatchMap, TopLevelKeys } from '../path-type.ts';

type Rules = typeof rustGrammarShape['rules'];

describe('FastKeys ≡ PreciseKeys (first-segment keys are enrich-invariant)', () => {
	it('Shape-1 (await_expression): post-enrich keys equal raw keys', () => {
		expectTypeOf<PathKey<EnrichRule<Rules['await_expression']>>>().toEqualTypeOf<PathKey<Rules['await_expression']>>();
	});

	it('Shape-2 nested insert (reference_type): keys still equal', () => {
		// reference_type inserts a FIELD INSIDE member-1's CHOICE — a deeper
		// level — yet the TOP-LEVEL member count is unchanged, so segment-1
		// keys are identical.
		expectTypeOf<PathKey<EnrichRule<Rules['reference_type']>>>().toEqualTypeOf<PathKey<Rules['reference_type']>>();
	});

	it('duplicate (index_expression): keys equal despite numbered fields', () => {
		expectTypeOf<PathKey<EnrichRule<Rules['index_expression']>>>().toEqualTypeOf<PathKey<Rules['index_expression']>>();
	});

	it('FastKeys/PreciseKeys aliases agree with the bare equality', () => {
		expectTypeOf<FastKeys<Rules['or_pattern']>>().toEqualTypeOf<PreciseKeys<Rules['or_pattern']>>();
	});
});

describe('per-rule transform patch-map (the TransformsConfig value surface)', () => {
	it('or_pattern: segment-1 keys are 0 | 1 (PREC>CHOICE, 2 arms)', () => {
		expectTypeOf<TopLevelKeys<Rules['or_pattern']>>().toEqualTypeOf<'0' | '1'>();
	});

	it('authored keys typecheck against the patch-map', () => {
		type Patch = TransformPatchMap<FastKeys<Rules['or_pattern']>>;
		// real authored paths (from overrides.ts): 0/0, 0/2, 1/1
		assertType<Patch>({ '0/0': { __sittirPlaceholder: 'field', name: 'left' } });
		assertType<Patch>({ '1/1': { __sittirPlaceholder: 'field', name: 'right' } });
	});

	it('out-of-bounds first segment is rejected (negative-controlled)', () => {
		type Patch = TransformPatchMap<FastKeys<Rules['or_pattern']>>;
		// @ts-expect-error — '7' is not a valid first segment for a 2-arm choice.
		const _bad: Patch = { '7': { __sittirPlaceholder: 'field', name: 'x' } };
		void _bad;
	});
});
