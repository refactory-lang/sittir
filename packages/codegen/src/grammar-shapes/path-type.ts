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
import type { FieldPlaceholder } from '../dsl/primitives/field.ts';
import type { VariantPlaceholder } from '../dsl/primitives/variant.ts';
import type { AliasPlaceholder } from '../dsl/primitives/alias.ts';
import type { FieldLike } from '../types/runtime-shapes.ts';

type PeelPrec<N extends GrammarRule> = N extends PrecRuleUnion ? PeelPrec<N['content']> : N;

type IndicesOf<M extends readonly unknown[]> = Extract<keyof M, `${number}`>;

export type TopLevelKeys<N extends GrammarRule> =
	PeelPrec<N> extends infer P
		? P extends SeqRule | ChoiceRule
			? IndicesOf<P['members']>
			: P extends SingleContentWrapper
				? '0'
				: never
		: never;

type NonNumericFirstSegment = '_' | `(${string})` | `${string}:` | `-${number}`;

export type PathKey<N extends GrammarRule> =
	| TopLevelKeys<N>
	| NonNumericFirstSegment
	| `${TopLevelKeys<N>}/${string}`
	| `${NonNumericFirstSegment}/${string}`;

export type TransformPatchValue = RuleOrLiteral | FieldPlaceholder | FieldLike | VariantPlaceholder | AliasPlaceholder;

export type TransformPatchMap<Keys extends string> = Partial<Record<Keys, TransformPatchValue>>;

export type FastKeys<R extends GrammarRule> = PathKey<R>;
