/**
 * path-type.ts — type-level transform PATH addressing over a (post-Enrich)
 * rule shape. Mirrors `dsl/transform/transform-path.ts`'s navigation:
 *
 *   - SEQ / CHOICE  : a numeric segment indexes `members[N]` (consumes 1).
 *   - PREC*         : TRANSPARENT — descend into `content`, DO NOT consume a
 *                     segment (path skips prec wrappers).
 *   - FIELD/ALIAS/REPEAT/REPEAT1/TOKEN/IMMEDIATE_TOKEN : single-content
 *                     wrappers — index 0 (or -1) descends into `content` and
 *                     CONSUMES the segment. FIELD is NOT transparent (it is a
 *                     real level — consistent with enrich INSERTING fields).
 *   - leaves (SYMBOL/STRING/PATTERN/BLANK) : no descent.
 *
 * Paths are `/`-joined segments, e.g. `'4/0'`, `'1/0'`. We model numeric
 * segments only (the dominant authoring form). Wildcard `_`, kind-match
 * `(name)`, and field-traversal `name:` are accepted by the runtime but are
 * left as `string`-typed escape hatches here (see PathKey below) — typing
 * them precisely is future work and degrading to `string` is sound.
 *
 * DEPTH / PERF (the stated risk): this resolves a CONCRETE path string to
 * the node at that position (`NodeAtPath`) — depth bounded by the path
 * length, NOT by enumerating all paths (no `type-fest` `Paths` over the
 * 182-rule registry, which would blow up). SYMBOL stays a lazy name-tagged
 * leaf: we do NOT follow symbols cross-rule (authored paths address within
 * one rule's inline nesting). First-segment autocomplete (`TopLevelKeys`) is
 * a cheap hand-rolled union over the top-level members tuple.
 */

import type { GrammarNode, SeqNode, ChoiceNode, PrecNodeUnion, SingleContentWrapper } from './grammar-json.ts';

// ---------------------------------------------------------------------------
// Split a `/`-joined path into a segment tuple.
// ---------------------------------------------------------------------------

type Split<S extends string> = S extends `${infer Head}/${infer Tail}` ? [Head, ...Split<Tail>] : [S];

// ---------------------------------------------------------------------------
// Resolve a single positional index against a node's children, after
// transparently peeling PREC wrappers.
// ---------------------------------------------------------------------------

/** Peel all leading PREC wrappers (transparent) to the structural node. */
type PeelPrec<N extends GrammarNode> = N extends PrecNodeUnion ? PeelPrec<N['content']> : N;

/** Parse a numeric-literal segment into a number; else never. */
type ToIndex<S extends string> = S extends `${infer N extends number}` ? N : never;

/**
 * The child node reached by index `I` at node `N` (after PREC peel):
 *   - container: members[I]
 *   - single-content wrapper: content (I must be 0 / -1; we accept any
 *     numeric for ergonomics since wrappers have one slot)
 */
type ChildAt<N extends GrammarNode, I extends number> = PeelPrec<N> extends infer P
	? P extends SeqNode | ChoiceNode
		? I extends keyof P['members']
			? P['members'][I] extends GrammarNode
				? P['members'][I]
				: never
			: never
		: P extends SingleContentWrapper
			? P['content']
			: never
	: never;

/**
 * Walk a tuple of (string) segments down the node tree. Each segment is a
 * numeric index. Returns the node at the addressed position, or `never` if
 * the path runs off a leaf / out of bounds.
 */
type WalkSegments<N extends GrammarNode, Segs extends readonly string[]> = Segs extends readonly [
	infer Head extends string,
	...infer Rest extends string[]
]
	? ToIndex<Head> extends infer I
		? I extends number
			? ChildAt<N, I> extends infer Child
				? Child extends GrammarNode
					? Rest extends readonly []
						? Child
						: WalkSegments<Child, Rest>
					: never
				: never
			: never // non-numeric segment -> unresolved
		: never
	: N;

/** The node a concrete path string resolves to within rule node `N`. */
export type NodeAtPath<N extends GrammarNode, P extends string> = WalkSegments<N, Split<P>>;

/** True iff path `P` resolves to a real node (not out-of-bounds/leaf-overrun). */
export type IsValidPath<N extends GrammarNode, P extends string> = [NodeAtPath<N, P>] extends [never] ? false : true;

// ---------------------------------------------------------------------------
// First-segment autocomplete (shallow). The cheap, perf-safe layer: the
// union of valid top-level index segments for a rule (after PREC peel).
// Editors offer these as completions for the first path segment.
// ---------------------------------------------------------------------------

type IndicesOf<M extends readonly unknown[]> = Extract<keyof M, `${number}`>;

/** Valid first-segment index strings for rule node `N` (top-level). */
export type TopLevelKeys<N extends GrammarNode> = PeelPrec<N> extends infer P
	? P extends SeqNode | ChoiceNode
		? IndicesOf<P['members']>
		: P extends SingleContentWrapper
			? '0'
			: never
	: never;

// ---------------------------------------------------------------------------
// PathKey — the type a transform patch-object KEY should have for rule `N`.
//
// Shallow-precise + deep-permissive: the FIRST segment autocompletes to the
// rule's real top-level indices; deeper segments degrade to free-form via the
// template-literal tail. This keeps editors offering the right first-level
// completions while never REJECTING a deeper valid path (soundness: we never
// claim a deep path is invalid when we can't prove it). Wildcard / kind-match
// / field-traversal segments fall under the `string` tail too.
// ---------------------------------------------------------------------------

export type PathKey<N extends GrammarNode> = TopLevelKeys<N> | `${TopLevelKeys<N>}/${string}`;
