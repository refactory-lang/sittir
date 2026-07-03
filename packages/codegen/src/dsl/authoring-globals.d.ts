// Sittir-owned authoring type surface for overrides.ts.
//
// These ambient `declare global` signatures type the tree-sitter-INJECTED DSL
// globals (`seq`/`choice`/`field`/…) over the sittir-owned `AuthoringRule`
// vocabulary (grammar-shapes rules + bare literals), so authoring in overrides.ts
// composes into the recursive rule types and gets IntelliSense.
//
// Why our own `AuthoringRule` and not tree-sitter's `RuleOrLiteral`: our rule
// shapes are READONLY tuples (needed for the `as const` emit + path indexing),
// which are NOT assignable to tree-sitter's MUTABLE `Rule`. Declaring the params
// over `AuthoringRule` lets our rules compose into each other (the mismatch that
// otherwise breaks `seq(choice(...))`). These merge with tree-sitter's ambient
// `declare function seq` as overloads; ours matches the grammar-shapes args.
// Scoped to overrides via tsconfig.overrides.json; codegen internals untouched.
//
// The declared set mirrors EXACTLY the runtime globals sittir injects
// (compiler/evaluate.ts saveAndInjectDslGlobals): grammar, seq, choice,
// optional, repeat, repeat1, sym, string, field, token, prec, alias, blank.
// Do not declare a global here without a runtime counterpart there — a
// bare-literal already types as `StringRule<S>` via `ToGrammarRule`, so no
// `str()`/`pattern()` wrappers exist (or are needed) at runtime.
import type {
	SeqRule,
	ChoiceRule,
	FieldRule,
	RepeatRule,
	Repeat1Rule,
	TokenRule,
	AliasRule,
	AuthoringRule,
	ToGrammarRule,
	AuthoringRulesToRules,
	SymbolRule,
	StringRule,
	PrecRule,
	PrecLeftRule,
	PrecRightRule,
	PrecDynamicRule,
	ImmediateTokenRule,
	BlankRule
} from '../grammar-shapes/grammar-json.ts';

declare global {
	function seq<M extends readonly AuthoringRule[]>(...members: M): SeqRule<AuthoringRulesToRules<M>>;
	function choice<M extends readonly AuthoringRule[]>(...members: M): ChoiceRule<AuthoringRulesToRules<M>>;
	function field<const N extends string, R extends AuthoringRule>(name: N, rule: R): FieldRule<N, ToGrammarRule<R>>;
	function optional<R extends AuthoringRule>(rule: R): ChoiceRule<[ToGrammarRule<R>, BlankRule]>;
	function repeat<R extends AuthoringRule>(rule: R): RepeatRule<ToGrammarRule<R>>;
	function repeat1<R extends AuthoringRule>(rule: R): Repeat1Rule<ToGrammarRule<R>>;

	// `token` / `prec` are callable VALUES with method properties, so they are
	// declared `const` with per-call-signature generics (an `interface` here
	// would declare a type, not the global value, and a generic param on the
	// container would make bare `token(...)` uninstantiable).
	const token: {
		<R extends AuthoringRule>(rule: R): TokenRule<ToGrammarRule<R>>;
		immediate<R extends AuthoringRule>(rule: R): ImmediateTokenRule<ToGrammarRule<R>>;
	};
	const prec: {
		<R extends AuthoringRule>(value: number | string, rule: R): PrecRule<ToGrammarRule<R>>;
		left<R extends AuthoringRule>(value: number | string, rule: R): PrecLeftRule<ToGrammarRule<R>>;
		right<R extends AuthoringRule>(value: number | string, rule: R): PrecRightRule<ToGrammarRule<R>>;
		dynamic<R extends AuthoringRule>(value: number, rule: R): PrecDynamicRule<ToGrammarRule<R>>;
	};

	function alias<R extends AuthoringRule, V extends string>(rule: R, value: V | SymbolRule<V>): AliasRule<V, ToGrammarRule<R>>;

	function sym<N extends string>(name: N): SymbolRule<N>;

	/** Runtime-injected `string()` literal wrapper (see saveAndInjectDslGlobals). */
	function string<const S extends string>(value: S): StringRule<S>;

	function blank(): BlankRule;
}

export {};
