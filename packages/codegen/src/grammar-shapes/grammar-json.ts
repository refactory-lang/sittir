/**
 * grammar-json.ts — tuple-precise REFINEMENT of tree-sitter's ambient `Rule`
 * vocabulary (from `tree-sitter-cli/dsl.d.ts`, in tsconfig `types`).
 *
 * tree-sitter's `Rule` is shapeless for our purpose: `SeqRule = { type:'SEQ';
 * members: Rule[] }` collapses every member to the `Rule` union, so there is
 * no positional information for path addressing. We ADD the recursion by
 * PARAMETERIZING each rule over its content:
 *
 *   SeqRule<M>       ChoiceRule<M>      — M extends readonly GrammarRule[] (tuple-precise)
 *   FieldRule<N,C>   RepeatRule<C> …    — C extends GrammarRule (single content slot)
 *   SymbolRule<N>    mirrors tree-sitter's ambient SymbolRule<N> shape (a leaf)
 *   StringRule<V>  PatternRule<V>  BlankRule — leaves
 *
 * SINGLE VOCABULARY: these are tree-sitter's discriminants, refined. Leaves
 * mirror tree-sitter's shapes structurally (`SymbolRule<N>`). The `as const`
 * grammar.json emit instantiates these with concrete READONLY tuples; the
 * deriver / Enrich<> / path types operate on that form.
 *
 * READONLY, by necessity (documented deviation from "rule MUST extend Rule"):
 * `as const` produces readonly tuples, and positional path indexing
 * (`members[0]`) + `EnrichRule<>`'s `N extends SeqRule<…>` matching both REQUIRE
 * readonly. But a readonly-membered container is NOT assignable to
 * tree-sitter's mutable `Rule` (`{ members: Rule[] }`) — empirically proven.
 * The two requirements (readonly-for-paths vs rule⊑Rule) are mutually
 * exclusive under one variance. Resolution:
 *   - bound containers over `readonly GrammarRule[]` (our union), NOT
 *     `readonly Rule[]` (which would demand GrammarRule ⊑ Rule → false).
 *   - the `$` proxy returns `SymbolRule<R>` (a leaf, IS RuleOrLiteral) so
 *     `$.r` still composes in seq()/choice(); it does NOT return the
 *     readonly recursive shape (which wouldn't compose, and isn't what
 *     tree-sitter returns at runtime anyway).
 *   - the `GrammarJson extends GrammarSchema<string>` ladder is proven via
 *     a `MutableDeep<>` bridge (below), not by making rules literally ⊑ Rule.
 *
 * NOTE: compiled grammar.json has NO `OPTIONAL` rule — tree-sitter lowers
 * `optional(x)` to `CHOICE(x, BLANK)`. The Enrich<> + path machinery match
 * on `CHOICE(_, BLANK)`, never a phantom OPTIONAL.
 *
 * `supertypes` rename: compiled grammar.json carries `supertypes: string[]`,
 * but tree-sitter's ambient `Grammar.supertypes` is an AUTHORING CALLBACK
 * (`($, prev) => RuleOrLiteral[]`). The two collide on the same key, blocking
 * `GrammarJson extends GrammarSchema<string>`. We emit the array under
 * `supertypeNames` instead. Nothing depends on the typed field (the runtime
 * cross-check reads the raw `require`; the type-level supertype set is the
 * hardcoded `RustSupertypes`).
 */

// ---------------------------------------------------------------------------
// Parameterized rule shapes — tree-sitter's discriminants, refined over content.
// Containers bound over `readonly GrammarRule[]`; leaves mirror tree-sitter's
// `SymbolRule` shape structurally. `Rule` is the ambient tree-sitter union.
// ---------------------------------------------------------------------------

export interface SeqRule<M extends readonly GrammarRule[] = readonly GrammarRule[]> {
	readonly type: 'SEQ';
	readonly members: M;
}
export interface ChoiceRule<M extends readonly GrammarRule[] = readonly GrammarRule[]> {
	readonly type: 'CHOICE';
	readonly members: M;
}
/** SYMBOL leaf — structurally mirrors tree-sitter's ambient `SymbolRule<Name>`
 *  (`{ type: 'SYMBOL'; name: Name }`). Defined as sittir's OWN interface,
 *  not an alias of the ambient type: this module renames its authoring
 *  shapes to the `<X>Rule` form (decision 5), so a local `SymbolRule` alias
 *  would shadow — and self-reference — the ambient `SymbolRule` it used to
 *  point to. Kept byte-identical in shape; only the definition strategy
 *  changed. */
export interface SymbolRule<Name extends string = string> {
	readonly type: 'SYMBOL';
	readonly name: Name;
}
export interface StringRule<V extends string = string> {
	readonly type: 'STRING';
	readonly value: V;
}
export interface PatternRule<V extends string | RegExp | RustRegex = string> {
	readonly type: 'PATTERN';
	readonly value: V;
	readonly flags?: string;
}
export interface BlankRule {
	readonly type: 'BLANK';
}
export interface RepeatRule<C extends GrammarRule = GrammarRule> {
	readonly type: 'REPEAT';
	readonly content: C;
}
export interface Repeat1Rule<C extends GrammarRule = GrammarRule> {
	readonly type: 'REPEAT1';
	readonly content: C;
}
export interface FieldRule<N extends string = string, C extends GrammarRule = GrammarRule> {
	readonly type: 'FIELD';
	readonly name: N;
	readonly content: C;
}
export interface AliasRule<V extends string = string, C extends GrammarRule = GrammarRule> {
	readonly type: 'ALIAS';
	readonly value: V;
	readonly named: boolean;
	readonly content: C;
}
export interface TokenRule<C extends GrammarRule = GrammarRule> {
	readonly type: 'TOKEN';
	readonly content: C;
}
export interface ImmediateTokenRule<C extends GrammarRule = GrammarRule> {
	readonly type: 'IMMEDIATE_TOKEN';
	readonly content: C;
}
export interface PrecRule<C extends GrammarRule = GrammarRule> {
	readonly type: 'PREC';
	readonly value: number;
	readonly content: C;
}
export interface PrecLeftRule<C extends GrammarRule = GrammarRule> {
	readonly type: 'PREC_LEFT';
	readonly value: number;
	readonly content: C;
}
export interface PrecRightRule<C extends GrammarRule = GrammarRule> {
	readonly type: 'PREC_RIGHT';
	readonly value: number;
	readonly content: C;
}
export interface PrecDynamicRule<C extends GrammarRule = GrammarRule> {
	readonly type: 'PREC_DYNAMIC';
	readonly value: number;
	readonly content: C;
}

/** Union of every compiled-grammar.json rule shape (loose any-rule alias). */
export type GrammarRule =
	| SeqRule<readonly GrammarRule[]>
	| ChoiceRule<readonly GrammarRule[]>
	| SymbolRule<string>
	| StringRule<string>
	| PatternRule<string>
	| BlankRule
	| RepeatRule<GrammarRule>
	| Repeat1Rule<GrammarRule>
	| FieldRule<string, GrammarRule>
	| AliasRule<string, GrammarRule>
	| TokenRule<GrammarRule>
	| ImmediateTokenRule<GrammarRule>
	| PrecRule<GrammarRule>
	| PrecLeftRule<GrammarRule>
	| PrecRightRule<GrammarRule>
	| PrecDynamicRule<GrammarRule>;

/**
 * Authoring-surface input: what the sittir-owned DSL primitives (`seq`/`choice`/
 * `field`/…) accept and compose in `overrides.ts`. A superset of the recursive
 * grammar-shape rules plus the bare literals tree-sitter allows. Deliberately
 * NOT tree-sitter's `RuleOrLiteral` (whose `Rule` members are MUTABLE, so our
 * readonly-tuple rule shapes aren't assignable to it — that mismatch is what
 * breaks `seq(choice(...))` composition). Our rules ARE `⊑ AuthoringRule`, so
 * they compose into each other.
 */
export type AuthoringRule = GrammarRule | string | RegExp;

export type ToGrammarRule<S extends string | RegExp | GrammarRule> = S extends string
	? StringRule<S>
	: S extends RegExp
		? PatternRule<S>
		: S extends GrammarRule
			? S
			: S;

export type AuthoringRulesToRules<M extends readonly AuthoringRule[]> = M extends readonly [
	infer Head extends AuthoringRule,
	...infer Rest extends AuthoringRule[]
]
	? [ToGrammarRule<Head>, ...AuthoringRulesToRules<Rest>]
	: [];

/** Top-level compiled grammar.json shape (the subset we type off). */
export interface GrammarJson {
	readonly name: string;
	readonly rules: Readonly<Record<string, GrammarRule>>;
	/** Compiled supertype-name array. Named `supertypeNames` (not
	 *  `supertypes`) to avoid colliding with tree-sitter's authoring callback
	 *  of the same name — see the file header. */
	readonly supertypeNames?: readonly string[];
}

// ---------------------------------------------------------------------------
// Discriminant guards used by the (purely type-level) Enrich<> + path types.
// ---------------------------------------------------------------------------

/** PREC wrappers are transparent to path addressing (skip a segment). */
export type PrecRuleUnion = PrecRule | PrecLeftRule | PrecRightRule | PrecDynamicRule;

/** Single-content wrappers that CONSUME a path segment (index 0 / -1). */
export type SingleContentWrapper = RepeatRule | Repeat1Rule | FieldRule | AliasRule | TokenRule | ImmediateTokenRule;

// ---------------------------------------------------------------------------
// MutableDeep<> — the readonly→mutable bridge used ONLY to PROVE the
// subtyping ladder `GrammarJson ⊑ GrammarSchema<string>` (modulo readonly).
// It recursively strips `readonly` so the result's containers become
// `members: GrammarRule[]` (mutable), which IS assignable to tree-sitter's
// `Rule`. Not used at any runtime/navigation site — purely an assertion aid.
// ---------------------------------------------------------------------------

export type MutableDeep<T> = T extends readonly (infer _U)[]
	? { -readonly [K in keyof T]: MutableDeep<T[K]> }
	: T extends object
		? { -readonly [K in keyof T]: MutableDeep<T[K]> }
		: T;
