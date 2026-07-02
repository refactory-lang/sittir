/**
 * enrich-type.ts — type-level mirror of `dsl/enrich.ts`'s STRUCTURAL field
 * insertion, for one rule body.
 *
 * WHY this is the linchpin: enrich is NOT path-transparent — it INSERTS
 * `FIELD(...)` nodes into the rule tree. A transform path that crosses a
 * wrapped position gains a level. So `Enrich<>` must reproduce enrich's
 * insertion sites exactly, or every typed path is confidently wrong.
 *
 * EMPIRICAL CONTRACT (verified against runtime `enrich()` on all 182
 * tree-sitter-rust rules — see enrich-fidelity.test.ts):
 *
 *  - Structure is FULLY LOCALLY DECIDABLE on rust: there are ZERO
 *    structural skips. Every top-level seq member matching Shape 1/2/3
 *    (after the `_`-prefix + supertype gate) becomes a FIELD at the SAME
 *    index. No nested-repeat disqualification or claimed-name collision
 *    causes a structural divergence on rust. So `Enrich<>` needs NO
 *    cross-tuple counting for the STRUCTURE — only local shape checks.
 *
 *  - Insertion sites are SHALLOW: only direct top-level seq members (after
 *    peeling PREC), plus one `REPEAT(seq(...))` / `REPEAT1(seq(...))`
 *    level. enrich does NOT wrap symbols buried deeper in nested
 *    choices/seqs. Below an insertion site the structure equals raw.
 *
 *  - The three shapes (mirroring `detectSymbolTarget`):
 *      Shape 1: bare `SYMBOL`                          -> FIELD wraps it
 *      Shape 2: `CHOICE(SYMBOL, BLANK)` (= optional)   -> FIELD wraps inner SYMBOL
 *      Shape 3: `CHOICE(SEQ(SYMBOL, anon...), BLANK)`  -> FIELD wraps the SYMBOL in the seq
 *    (compiled grammar.json has NO OPTIONAL node; optionals are
 *    CHOICE(_, BLANK).)
 *
 *  - The `_`-prefix gate (mirroring applySymbolToField): a symbol whose
 *    name starts with `_` only wraps when it is Shape 1 AND its name is a
 *    declared supertype; then the field name is the name with `_` stripped.
 *    `_`-prefixed Shape 2/3 are LEFT UNWRAPPED (e.g. break_expression's
 *    `optional($._expression)` stays raw; reference_type's
 *    `optional($.lifetime)` wraps because `lifetime` is non-`_`).
 *
 *  - The optional-keyword (`_marker`) pass does NOT fire on compiled
 *    grammar.json: `walkOptionalKeyword` matches CHOICE before peeling, so
 *    a compiled `CHOICE(STRING,BLANK)` is never seen as an optional. (The
 *    `*_marker` fields in the generated grammar are AUTHOR overrides, not
 *    enrich output.) So `Enrich<>` does NOT model it. NOTE: this is
 *    input-form-dependent — sittir's `{type:'OPTIONAL'}` form WOULD fire
 *    pass 3; correct here only because we type off compiled grammar.json.
 *
 * SOUNDNESS: field NAMES for numbered duplicates (e.g. index_expression's
 * `expression1`/`expression2`) need cross-tuple counting. Per the soundness
 * rule (degrade NAME, never STRUCTURE), when a wrapped symbol's name is not
 * provably unique among its siblings we widen the inserted FIELD's `name`
 * to `string` rather than guess. The FIELD still lands at the right index,
 * so PATHS stay correct; only the displayed name degrades. (On rust this
 * affects only `type_item` and `index_expression`.)
 */

import type {
	GrammarNode,
	Seq as SeqNode,
	Choice as ChoiceNode,
	Sym as SymbolNode,
	Blank as BlankNode,
	Field as FieldNode,
	Repeat as RepeatNode,
	Repeat1 as Repeat1Node,
	PrecNodeUnion
} from './grammar-json.ts';

/** tree-sitter-rust declared supertypes (from grammar.json `supertypes`). */
export type RustSupertypes =
	| '_expression'
	| '_type'
	| '_literal'
	| '_literal_pattern'
	| '_declaration_statement'
	| '_pattern';

// ---------------------------------------------------------------------------
// PREC transparency — peel/rebuild a single layer at a time.
// ---------------------------------------------------------------------------

type IsPrec<N> = N extends PrecNodeUnion ? true : false;

/** Wrap `Inner` back in the prec node `P`'s shape (preserve value+type). */
type RewrapPrec<P extends PrecNodeUnion, Inner extends GrammarNode> = Omit<P, 'content'> & { content: Inner };

// ---------------------------------------------------------------------------
// optional detection: CHOICE(X, BLANK) (order-insensitive, exactly 2 members)
// ---------------------------------------------------------------------------

type IsBlank<N> = N extends BlankNode ? true : false;

/** If `C` is `CHOICE(X, BLANK)`, yields `X`; else `never`. */
type OptionalInner<C extends ChoiceNode> = C['members'] extends readonly [infer A, infer B]
	? A extends GrammarNode
		? B extends GrammarNode
			? IsBlank<B> extends true
				? A
				: IsBlank<A> extends true
					? B
					: never
			: never
		: never
	: never;

// ---------------------------------------------------------------------------
// Field-name decision for a wrapped symbol.
// ---------------------------------------------------------------------------
// Soundness: numbered-duplicate names need cross-tuple counting, which we do
// NOT attempt structurally. The base name is the symbol name (supertype:
// strip leading `_`). When the same base name occurs more than once among
// the seq's wrap-eligible members, the runtime numbers them — so we widen to
// `string` (degrade NAME, keep STRUCTURE). Uniqueness is decided by
// CountBaseName over the members tuple.

type StripUnderscore<S extends string> = S extends `_${infer R}` ? R : S;

/** Base field name for a symbol name (supertype prefix stripped). */
type BaseFieldName<Name extends string> = Name extends RustSupertypes ? StripUnderscore<Name> : Name;

// ---------------------------------------------------------------------------
// Per-member symbol target detection (mirrors detectSymbolTarget).
// Returns the wrapped symbol NAME (string) eligible for fielding, or never.
// Applies the `_`-prefix gate: `_`-names only via Shape 1 + supertype.
// ---------------------------------------------------------------------------

/** Shape 3: SEQ whose members are exactly one SYMBOL + anon (STRING/PATTERN). */
type Shape3Symbol<S extends SeqNode> = ExtractLoneSymbol<S['members']>;

type ExtractLoneSymbol<M extends readonly GrammarNode[], Found extends string | 'none' = 'none'> = M extends readonly [
	infer Head,
	...infer Tail
]
	? Head extends SymbolNode
		? Found extends 'none'
			? Tail extends readonly GrammarNode[]
				? ExtractLoneSymbol<Tail, Head['name']>
				: never
			: never // >1 SYMBOL -> too complex
		: Head extends { type: 'STRING' } | { type: 'PATTERN' }
			? Tail extends readonly GrammarNode[]
				? ExtractLoneSymbol<Tail, Found>
				: never
			: never // non-anon, non-symbol -> too complex
	: Found extends 'none'
		? never
		: Found;

/**
 * The symbol NAME a member would wrap (eligibility), or `never`.
 * `_`-prefixed names: only Shape 1 + supertype (else never).
 */
type MemberWrapName<N extends GrammarNode> = N extends SymbolNode
	? // Shape 1 (bare symbol): `_`-names only if supertype.
		N['name'] extends `_${string}`
		? N['name'] extends RustSupertypes
			? N['name']
			: never
		: N['name']
	: N extends ChoiceNode
		? OptionalInner<N> extends infer Inner
			? Inner extends SymbolNode
				? // Shape 2 (optional symbol): `_`-names NEVER (gate).
					Inner['name'] extends `_${string}`
					? never
					: Inner['name']
				: Inner extends SeqNode
					? // Shape 3 (optional seq with lone symbol): `_`-names NEVER.
						Shape3Symbol<Inner> extends infer SymName
						? SymName extends `_${string}`
							? never
							: SymName extends string
								? SymName
								: never
						: never
					: never
			: never
		: never;

// Count how many members share a given base field name (for uniqueness).
type CountBase<
	M extends readonly GrammarNode[],
	Target extends string,
	Acc extends unknown[] = []
> = M extends readonly [infer Head, ...infer Tail]
	? Head extends GrammarNode
		? Tail extends readonly GrammarNode[]
			? MemberWrapName<Head> extends infer WName
				? WName extends string
					? BaseFieldName<WName> extends Target
						? CountBase<Tail, Target, [...Acc, 1]>
						: CountBase<Tail, Target, Acc>
					: CountBase<Tail, Target, Acc>
				: CountBase<Tail, Target, Acc>
			: Acc['length']
		: Acc['length']
	: Acc['length'];

/** Field name to emit: base name if unique among siblings, else `string`. */
type FieldNameFor<
	WName extends string,
	AllMembers extends readonly GrammarNode[]
> = CountBase<AllMembers, BaseFieldName<WName>> extends 1 ? BaseFieldName<WName> : string;

// ---------------------------------------------------------------------------
// Member rewrite: insert FIELD at the wrap site, preserving structure.
// ---------------------------------------------------------------------------

type WrapShape1<Name extends string, Sym extends SymbolNode> = FieldNode & {
	type: 'FIELD';
	name: Name;
	content: Sym;
};

/**
 * Rebuild a CHOICE(X,BLANK) members tuple with the non-BLANK member replaced
 * by NewX. Maps over a CLEAN tuple param `M` (not an intersection's indexed
 * access) so classic TS keeps tuple-ness — an intersection-sourced
 * `[K in keyof (C & ChoiceNode)['members']]` collapses to a numeric-keyed
 * object under tsserver/vue-tsc (the engine editors run) and breaks the
 * downstream constraints, cascading every EnrichRule<> result to `never`.
 */
type ReplaceOptionalMembers<M extends readonly GrammarNode[], NewX extends GrammarNode> = {
	[K in keyof M]: M[K] extends BlankNode ? M[K] : NewX;
};

/** Rebuild a Shape-3 SEQ members tuple with its lone SYMBOL FIELD-wrapped. */
type WrapShape3Members<M extends readonly GrammarNode[], Name extends string> = {
	[K in keyof M]: M[K] extends SymbolNode ? WrapShape1<Name, M[K]> : M[K];
};

/**
 * Rewrite a single seq member, inserting a FIELD if it is a wrap target.
 * `AllMembers` is the sibling tuple (for the uniqueness/name decision).
 */
type EnrichMember<N extends GrammarNode, AllMembers extends readonly GrammarNode[]> = MemberWrapName<N> extends infer WName
	? // never-guard FIRST: a non-wrap member yields `WName = never`, and a
		// bare `WName extends string` DISTRIBUTES over never -> never (the
		// `: N` fallback is unreachable), collapsing every non-wrapped member.
		// `[never] extends [string]` is `true`, so the never test must precede.
		[WName] extends [never]
		? N // not a wrap target -> unchanged
		: WName extends string
			? FieldNameFor<WName, AllMembers> extends infer FName
				? FName extends string
				? N extends SymbolNode
					? WrapShape1<FName, N> // Shape 1
					: N extends ChoiceNode
						? N['members'] extends infer CM extends readonly GrammarNode[]
							? OptionalInner<N> extends infer Inner
								? Inner extends SymbolNode
									? ChoiceNode & { type: 'CHOICE'; members: ReplaceOptionalMembers<CM, WrapShape1<FName, Inner>> } // Shape 2
									: Inner extends SeqNode
										? Inner['members'] extends infer SM extends readonly GrammarNode[]
											? ChoiceNode & {
													type: 'CHOICE';
													members: ReplaceOptionalMembers<CM, SeqNode & { type: 'SEQ'; members: WrapShape3Members<SM, FName> }>;
												} // Shape 3
											: N
										: N
								: N
							: N
						: N
				: N
			: N
		: N // not a wrap target -> unchanged
	: N;

/** Map every member of a top-level seq through EnrichMember. */
type EnrichSeqMembers<M extends readonly GrammarNode[]> = {
	[K in keyof M]: M[K] extends GrammarNode ? EnrichMember<M[K], M> : M[K];
};

// ---------------------------------------------------------------------------
// Repeat(seq(...)) one-level descent (mirrors promoteInsideRepeatMembers /
// tryPromoteInRepeatSeq). We field-promote bare symbols inside a
// REPEAT/REPEAT1 whose content is a SEQ, at one level only.
// ---------------------------------------------------------------------------

type EnrichRepeatContent<C extends GrammarNode> = C extends SeqNode
	? { type: 'SEQ'; members: EnrichSeqMembers<C['members']> }
	: C;

// ---------------------------------------------------------------------------
// Top-level entry: Enrich one rule body.
//   - PREC: peel transparently, enrich inner, rewrap.
//   - SEQ:  enrich each member.
//   - REPEAT/REPEAT1 of SEQ: enrich the inner seq members.
//   - anything else (bare CHOICE of symbols, single SYMBOL, token, etc.):
//     unchanged (enrich only wraps within a top-level SEQ context).
// ---------------------------------------------------------------------------

export type EnrichRule<N extends GrammarNode> = IsPrec<N> extends true
	? N extends PrecNodeUnion
		? RewrapPrec<N, EnrichRule<N['content']>>
		: N
	: N extends SeqNode
		? { type: 'SEQ'; members: EnrichSeqMembers<N['members']> }
		: N extends RepeatNode
			? { type: 'REPEAT'; content: EnrichRepeatContent<N['content']> }
			: N extends Repeat1Node
				? { type: 'REPEAT1'; content: EnrichRepeatContent<N['content']> }
				: N;

// Re-exports for consumers.
export type { GrammarNode, SeqNode, ChoiceNode, SymbolNode, FieldNode };
