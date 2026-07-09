/**
 * enrich-type.ts — type-level mirror of `dsl/enrich.ts`'s STRUCTURAL field
 * insertion, for one rule body.
 *
 * WHY this is the linchpin: enrich is NOT path-transparent — it INSERTS
 * `FIELD(...)` rules into the rule tree. A transform path that crosses a
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
 *    (compiled grammar.json has NO OPTIONAL rule; optionals are
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
	GrammarRule,
	SeqRule,
	ChoiceRule,
	SymbolRule,
	BlankRule,
	FieldRule,
	RepeatRule,
	Repeat1Rule,
	PrecRuleUnion
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

type IsPrec<N> = N extends PrecRuleUnion ? true : false;

/** Wrap `Inner` back in the prec rule `P`'s shape (preserve value+type). */
type RewrapPrec<P extends PrecRuleUnion, Inner extends GrammarRule> = Omit<P, 'content'> & { content: Inner };

// ---------------------------------------------------------------------------
// optional detection: CHOICE(X, BLANK) (order-insensitive, exactly 2 members)
// ---------------------------------------------------------------------------

type IsBlank<N> = N extends BlankRule ? true : false;

/** If `C` is `CHOICE(X, BLANK)`, yields `X`; else `never`. */
type OptionalInner<C extends ChoiceRule> = C['members'] extends readonly [infer A, infer B]
	? A extends GrammarRule
		? B extends GrammarRule
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
type Shape3Symbol<S extends SeqRule> = ExtractLoneSymbol<S['members']>;

type ExtractLoneSymbol<M extends readonly GrammarRule[], Found extends string | 'none' = 'none'> = M extends readonly [
	infer Head,
	...infer Tail
]
	? Head extends SymbolRule
		? Found extends 'none'
			? Tail extends readonly GrammarRule[]
				? ExtractLoneSymbol<Tail, Head['name']>
				: never
			: never // >1 SYMBOL -> too complex
		: Head extends { type: 'STRING' } | { type: 'PATTERN' }
			? Tail extends readonly GrammarRule[]
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
type MemberWrapName<N extends GrammarRule> = N extends SymbolRule
	? // Shape 1 (bare symbol): `_`-names only if supertype.
		N['name'] extends `_${string}`
		? N['name'] extends RustSupertypes
			? N['name']
			: never
		: N['name']
	: N extends ChoiceRule
		? OptionalInner<N> extends infer Inner
			? Inner extends SymbolRule
				? // Shape 2 (optional symbol): `_`-names NEVER (gate).
					Inner['name'] extends `_${string}`
					? never
					: Inner['name']
				: Inner extends SeqRule
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
	M extends readonly GrammarRule[],
	Target extends string,
	Acc extends unknown[] = []
> = M extends readonly [infer Head, ...infer Tail]
	? Head extends GrammarRule
		? Tail extends readonly GrammarRule[]
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
type FieldNameFor<WName extends string, AllMembers extends readonly GrammarRule[]> =
	CountBase<AllMembers, BaseFieldName<WName>> extends 1 ? BaseFieldName<WName> : string;

// ---------------------------------------------------------------------------
// Member rewrite: insert FIELD at the wrap site, preserving structure.
// ---------------------------------------------------------------------------

type WrapShape1<Name extends string, SymLeaf extends SymbolRule> = FieldRule & {
	type: 'FIELD';
	name: Name;
	content: SymLeaf;
};

/**
 * Rebuild a CHOICE(X,BLANK) members tuple with the non-BLANK member replaced
 * by NewX. Maps over a CLEAN tuple param `M` (not an intersection's indexed
 * access) so classic TS keeps tuple-ness — an intersection-sourced
 * `[K in keyof (C & ChoiceRule)['members']]` collapses to a numeric-keyed
 * object under tsserver/vue-tsc (the engine editors run) and breaks the
 * downstream constraints, cascading every EnrichRule<> result to `never`.
 */
type ReplaceOptionalMembers<M extends readonly GrammarRule[], NewX extends GrammarRule> = {
	[K in keyof M]: M[K] extends BlankRule ? M[K] : NewX;
};

/** Rebuild a Shape-3 SEQ members tuple with its lone SYMBOL FIELD-wrapped. */
type WrapShape3Members<M extends readonly GrammarRule[], Name extends string> = {
	[K in keyof M]: M[K] extends SymbolRule ? WrapShape1<Name, M[K]> : M[K];
};

/**
 * Rewrite a single seq member, inserting a FIELD if it is a wrap target.
 * `AllMembers` is the sibling tuple (for the uniqueness/name decision).
 */
type EnrichMember<N extends GrammarRule, AllMembers extends readonly GrammarRule[]> =
	MemberWrapName<N> extends infer WName
		? // never-guard FIRST: a non-wrap member yields `WName = never`, and a
			// bare `WName extends string` DISTRIBUTES over never -> never (the
			// `: N` fallback is unreachable), collapsing every non-wrapped member.
			// `[never] extends [string]` is `true`, so the never test must precede.
			[WName] extends [never]
			? N // not a wrap target -> unchanged
			: WName extends string
				? FieldNameFor<WName, AllMembers> extends infer FName
					? FName extends string
						? N extends SymbolRule
							? WrapShape1<FName, N> // Shape 1
							: N extends ChoiceRule
								? N['members'] extends infer CM extends readonly GrammarRule[]
									? OptionalInner<N> extends infer Inner
										? Inner extends SymbolRule
											? ChoiceRule & { type: 'CHOICE'; members: ReplaceOptionalMembers<CM, WrapShape1<FName, Inner>> } // Shape 2
											: Inner extends SeqRule
												? Inner['members'] extends infer SM extends readonly GrammarRule[]
													? ChoiceRule & {
															type: 'CHOICE';
															members: ReplaceOptionalMembers<
																CM,
																SeqRule & { type: 'SEQ'; members: WrapShape3Members<SM, FName> }
															>;
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
type EnrichSeqMembers<M extends readonly GrammarRule[]> = {
	[K in keyof M]: M[K] extends GrammarRule ? EnrichMember<M[K], M> : M[K];
};

// ---------------------------------------------------------------------------
// Repeat(seq(...)) one-level descent (mirrors promoteInsideRepeatMembers /
// tryPromoteInRepeatSeq). We field-promote bare symbols inside a
// REPEAT/REPEAT1 whose content is a SEQ, at one level only.
// ---------------------------------------------------------------------------

type EnrichRepeatContent<C extends GrammarRule> = C extends SeqRule
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

export type EnrichRule<N extends GrammarRule> =
	IsPrec<N> extends true
		? N extends PrecRuleUnion
			? RewrapPrec<N, EnrichRule<N['content']>>
			: N
		: N extends SeqRule
			? { type: 'SEQ'; members: EnrichSeqMembers<N['members']> }
			: N extends RepeatRule
				? { type: 'REPEAT'; content: EnrichRepeatContent<N['content']> }
				: N extends Repeat1Rule
					? { type: 'REPEAT1'; content: EnrichRepeatContent<N['content']> }
					: N;

// Re-exports for consumers.
export type { GrammarRule, SeqRule, ChoiceRule, SymbolRule, FieldRule };
