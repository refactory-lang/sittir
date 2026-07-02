/**
 * grammar-json.ts — tuple-precise REFINEMENT of tree-sitter's ambient `Rule`
 * vocabulary (from `tree-sitter-cli/dsl.d.ts`, in tsconfig `types`).
 *
 * tree-sitter's `Rule` is shapeless for our purpose: `SeqRule = { type:'SEQ';
 * members: Rule[] }` collapses every member to the `Rule` union, so there is
 * no positional information for path addressing. We ADD the recursion by
 * PARAMETERIZING each node over its content:
 *
 *   Seq<M>      Choice<M>     — M extends readonly GrammarNode[] (tuple-precise)
 *   Field<N,C>  Repeat<C> …   — C extends GrammarNode (single content slot)
 *   Sym<N>      = tree-sitter's SymbolRule<N> (reused directly — a leaf)
 *   Str<V> Pattern<V> Blank   — leaves
 *
 * SINGLE VOCABULARY: these are tree-sitter's discriminants, refined. Leaves
 * reuse tree-sitter's types directly (`SymbolRule<N>`). The `as const`
 * grammar.json emit instantiates these with concrete READONLY tuples; the
 * deriver / Enrich<> / path types operate on that form.
 *
 * READONLY, by necessity (documented deviation from "node MUST extend Rule"):
 * `as const` produces readonly tuples, and positional path indexing
 * (`members[0]`) + `EnrichRule<>`'s `N extends Seq<…>` matching both REQUIRE
 * readonly. But a readonly-membered container is NOT assignable to
 * tree-sitter's mutable `Rule` (`{ members: Rule[] }`) — empirically proven.
 * The two requirements (readonly-for-paths vs node⊑Rule) are mutually
 * exclusive under one variance. Resolution:
 *   - bound containers over `readonly GrammarNode[]` (our union), NOT
 *     `readonly Rule[]` (which would demand GrammarNode ⊑ Rule → false).
 *   - the `$` proxy returns `SymbolRule<R>` (a leaf, IS RuleOrLiteral) so
 *     `$.r` still composes in seq()/choice(); it does NOT return the
 *     readonly recursive shape (which wouldn't compose, and isn't what
 *     tree-sitter returns at runtime anyway).
 *   - the `GrammarJson extends GrammarSchema<string>` ladder is proven via
 *     a `MutableDeep<>` bridge (below), not by making nodes literally ⊑ Rule.
 *
 * NOTE: compiled grammar.json has NO `OPTIONAL` node — tree-sitter lowers
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
// Parameterized node types — tree-sitter's discriminants, refined over content.
// Containers bound over `readonly GrammarNode[]`; leaves reuse tree-sitter's
// `SymbolRule` directly. `Rule` is the ambient tree-sitter union.
// ---------------------------------------------------------------------------

export interface Seq<M extends readonly GrammarNode[] = readonly GrammarNode[]> {
	readonly type: 'SEQ';
	readonly members: M;
}
export interface Choice<M extends readonly GrammarNode[] = readonly GrammarNode[]> {
	readonly type: 'CHOICE';
	readonly members: M;
}
/** SYMBOL leaf — reuse tree-sitter's generic `SymbolRule<Name>` directly. */
export type Sym<Name extends string = string> = SymbolRule<Name>;
export interface Str<V extends string = string> {
	readonly type: 'STRING';
	readonly value: V;
}
export interface Pattern<V extends string | RegExp | RustRegex = string> {
	readonly type: 'PATTERN';
	readonly value: V;
	readonly flags?: string;
}
export interface Blank {
	readonly type: 'BLANK';
}
export interface Repeat<C extends GrammarNode = GrammarNode> {
	readonly type: 'REPEAT';
	readonly content: C;
}
export interface Repeat1<C extends GrammarNode = GrammarNode> {
	readonly type: 'REPEAT1';
	readonly content: C;
}
export interface Field<N extends string = string, C extends GrammarNode = GrammarNode> {
	readonly type: 'FIELD';
	readonly name: N;
	readonly content: C;
}
export interface Alias<V extends string = string, C extends GrammarNode = GrammarNode> {
	readonly type: 'ALIAS';
	readonly value: V;
	readonly named: boolean;
	readonly content: C;
}
export interface Token<C extends GrammarNode = GrammarNode> {
	readonly type: 'TOKEN';
	readonly content: C;
}
export interface ImmediateToken<C extends GrammarNode = GrammarNode> {
	readonly type: 'IMMEDIATE_TOKEN';
	readonly content: C;
}
export interface Prec<C extends GrammarNode = GrammarNode> {
	readonly type: 'PREC';
	readonly value: number;
	readonly content: C;
}
export interface PrecLeft<C extends GrammarNode = GrammarNode> {
	readonly type: 'PREC_LEFT';
	readonly value: number;
	readonly content: C;
}
export interface PrecRight<C extends GrammarNode = GrammarNode> {
	readonly type: 'PREC_RIGHT';
	readonly value: number;
	readonly content: C;
}
export interface PrecDynamic<C extends GrammarNode = GrammarNode> {
	readonly type: 'PREC_DYNAMIC';
	readonly value: number;
	readonly content: C;
}

/** Union of every compiled-grammar.json node shape (loose any-node alias). */
export type GrammarNode =
	| Seq<readonly GrammarNode[]>
	| Choice<readonly GrammarNode[]>
	| Sym<string>
	| Str<string>
	| Pattern<string>
	| Blank
	| Repeat<GrammarNode>
	| Repeat1<GrammarNode>
	| Field<string, GrammarNode>
	| Alias<string, GrammarNode>
	| Token<GrammarNode>
	| ImmediateToken<GrammarNode>
	| Prec<GrammarNode>
	| PrecLeft<GrammarNode>
	| PrecRight<GrammarNode>
	| PrecDynamic<GrammarNode>;

/**
 * Authoring-surface input: what the sittir-owned DSL primitives (`seq`/`choice`/
 * `field`/…) accept and compose in `overrides.ts`. A superset of the recursive
 * grammar-shape nodes plus the bare literals tree-sitter allows. Deliberately
 * NOT tree-sitter's `RuleOrLiteral` (whose `Rule` members are MUTABLE, so our
 * readonly-tuple node types aren't assignable to it — that mismatch is what
 * breaks `seq(choice(...))` composition). Our nodes ARE `⊑ AuthoringRule`, so
 * they compose into each other.
 */
export type AuthoringRule = GrammarNode | string | RegExp;

export type AuthoringRuleToNode<S extends string | RegExp | GrammarNode> = S extends string ? Str<S> : S extends RegExp ? Pattern<S> : S extends GrammarNode ? S : S;

export type AuthoringRulesToRules<M extends readonly AuthoringRule[]> = M extends readonly [infer Head extends AuthoringRule, ...infer Rest extends AuthoringRule[]] ? [AuthoringRuleToNode<Head>, ...AuthoringRulesToRules<Rest>] : [];

/** Top-level compiled grammar.json shape (the subset we type off). */
export interface GrammarJson {
	readonly name: string;
	readonly rules: Readonly<Record<string, GrammarNode>>;
	/** Compiled supertype-name array. Named `supertypeNames` (not
	 *  `supertypes`) to avoid colliding with tree-sitter's authoring callback
	 *  of the same name — see the file header. */
	readonly supertypeNames?: readonly string[];
}

// ---------------------------------------------------------------------------
// Discriminant guards used by the (purely type-level) Enrich<> + path types.
// ---------------------------------------------------------------------------

/** PREC wrappers are transparent to path addressing (skip a segment). */
export type PrecNodeUnion = Prec | PrecLeft | PrecRight | PrecDynamic;

/** Single-content wrappers that CONSUME a path segment (index 0 / -1). */
export type SingleContentWrapper = Repeat | Repeat1 | Field | Alias | Token | ImmediateToken;

/** Container nodes whose members are positionally addressable. */
export type ContainerNode<M extends readonly GrammarNode[] = GrammarNode[]> = Seq<M> | Choice<M>;

// ---------------------------------------------------------------------------
// MutableDeep<> — the readonly→mutable bridge used ONLY to PROVE the
// subtyping ladder `GrammarJson ⊑ GrammarSchema<string>` (modulo readonly).
// It recursively strips `readonly` so the result's containers become
// `members: GrammarNode[]` (mutable), which IS assignable to tree-sitter's
// `Rule`. Not used at any runtime/navigation site — purely an assertion aid.
// ---------------------------------------------------------------------------

export type MutableDeep<T> = T extends readonly (infer _U)[]
	? { -readonly [K in keyof T]: MutableDeep<T[K]> }
	: T extends object
		? { -readonly [K in keyof T]: MutableDeep<T[K]> }
		: T;
