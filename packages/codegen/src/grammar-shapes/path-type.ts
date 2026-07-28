/**
 * path-type.ts — type-level FIRST-SEGMENT addressing for transform PATH
 * keys over a (post-Enrich) rule shape.
 *
 * Only the first path segment is resolved precisely (`TopLevelKeys`), after
 * transparently peeling PREC wrappers (PREC does not consume a segment):
 *
 *   - SEQ / CHOICE  : the segment must be a valid `members` index.
 *   - single-content wrappers (FIELD/ALIAS/REPEAT/REPEAT1/TOKEN/
 *     IMMEDIATE_TOKEN) : the only valid segment is `'0'`.
 *   - leaves (SYMBOL/STRING/PATTERN/BLANK) : no valid segment (`never`).
 *
 * Everything past the first segment (`PathKey`'s `/${string}` tail) is
 * free-form and unchecked — deep paths are accepted permissively rather
 * than walked and bounds-checked (soundness: never REJECT a deep path we
 * can't prove invalid). The full recursive path-to-rule resolver this
 * module used to expose (`RuleAtPath`) was deleted as dead code (Track 1
 * sweep, commit `662fde555`); this module now only powers segment-1
 * autocomplete/validation, not full path resolution.
 *
 * Paths are `/`-joined segments, e.g. `'4/0'`, `'1/0'`. We model numeric
 * segments only (the dominant authoring form). Wildcard `_`, kind-match
 * `(name)`, and field-traversal `name:` are accepted by the runtime but are
 * left as `string`-typed escape hatches here (see PathKey below) — typing
 * them precisely is future work and degrading to `string` is sound.
 *
 * PERF (the stated risk): First-segment autocomplete (`TopLevelKeys`) is a
 * cheap hand-rolled union over the top-level members tuple, NOT a full path
 * walk over all paths (no `type-fest` `Paths` over the 182-rule registry,
 * which would blow up). SYMBOL stays a lazy name-tagged leaf: we do NOT
 * follow symbols cross-rule (authored paths address within one rule's
 * inline nesting).
 */

import type { GrammarRule, SeqRule, ChoiceRule, PrecRuleUnion, SingleContentWrapper } from './grammar-json.ts';
// Type-only imports of the DSL primitive return interfaces (DRY value-axis;
// no runtime cycle — primitives don't import grammar-shapes).
import type { FieldPlaceholder } from '../dsl/primitives/field.ts';
import type { VariantPlaceholder } from '../dsl/primitives/variant.ts';
import type { AliasPlaceholder } from '../dsl/primitives/alias.ts';
import type { FieldLike } from '../types/runtime-shapes.ts';

// ---------------------------------------------------------------------------
// Resolve a single positional index against a rule's children, after
// transparently peeling PREC wrappers.
// ---------------------------------------------------------------------------

type PeelPrec<N extends GrammarRule> = N extends PrecRuleUnion ? PeelPrec<N['content']> : N;

// ---------------------------------------------------------------------------
// First-segment autocomplete (shallow). The cheap, perf-safe layer: the
// union of valid top-level index segments for a rule (after PREC peel).
// Editors offer these as completions for the first path segment.
// ---------------------------------------------------------------------------

type IndicesOf<M extends readonly unknown[]> = Extract<keyof M, `${number}`>;

export type TopLevelKeys<N extends GrammarRule> =
	PeelPrec<N> extends infer P
		? P extends SeqRule | ChoiceRule
			? IndicesOf<P['members']>
			: P extends SingleContentWrapper
				? '0'
				: never
		: never;

// ---------------------------------------------------------------------------
// PathKey — the type a transform patch-object KEY should have for rule `N`.
//
// Shallow-precise + deep-permissive: the FIRST segment autocompletes to the
// rule's real top-level INDICES (`TopLevelKeys`, bounds-checked), but the
// `parsePath` grammar also admits non-numeric first segments the type model
// can't bounds-check — wildcard `_`, kind-match `(name)`, field-traversal
// `name:`, reverse index `-N` (see dsl/transform/transform-path.ts::parsePath).
// Those are accepted permissively so authored paths like `'(_expression)'` /
// `'_'` / `'-1'` don't false-reject. Deeper segments degrade to free-form via
// the `/${string}` tail (soundness: never REJECT a deep path we can't prove
// invalid).
//
// CRUCIAL: the precise numeric `TopLevelKeys` arm is preserved — the
// permissive arms must NOT widen the whole union to `string`, or out-of-bounds
// numeric keys (e.g. `'7'` on a 2-arm choice) would be silently accepted. That
// OOB rejection is guarded by the negative-controlled @ts-expect-error in
// intellisense-demo.test-d.ts.
// ---------------------------------------------------------------------------

type NonNumericFirstSegment = '_' | `(${string})` | `${string}:` | `-${number}`;

export type PathKey<N extends GrammarRule> =
	| TopLevelKeys<N>
	| NonNumericFirstSegment
	| `${TopLevelKeys<N>}/${string}`
	| `${NonNumericFirstSegment}/${string}`;

// ---------------------------------------------------------------------------
// Per-rule transform patch-map types (Phase-2 TransformsConfig upgrade).
//
// `TransformPatchMap<R>` keys each patch entry by `PathKey<R>`
// (segment-1-precise) and values by the patch-value union. `TransformsFor<S>`
// maps EVERY rule kind in a schema to its `original`-shape's patch-map — this
// is the 182-rule mapped type whose PERF is the stated risk, so it's
// parameterized over `KeyOf<R>` (swap the key strategy without
// touching the value/mapping machinery):
//
//   - PRECISE keys: `PathKey<EnrichRule<R>>` — instantiates EnrichRule
//     per rule (the cost driver).
//   - FAST keys: `PathKey<R>` on the RAW rule — top-level member count
//     is enrich-INVARIANT (enrich wraps in-place, never adds/removes a
//     top-level member), so segment-1 autocomplete is identical without
//     instantiating EnrichRule. Used as the perf fallback if PRECISE degrades
//     tsgo time.
// ---------------------------------------------------------------------------

export type TransformPatchValue = RuleOrLiteral | FieldPlaceholder | FieldLike | VariantPlaceholder | AliasPlaceholder;

export type TransformPatchMap<Keys extends string> = Partial<Record<Keys, TransformPatchValue>>;

export type FastKeys<R extends GrammarRule> = PathKey<R>;
