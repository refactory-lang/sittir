// Sittir-owned authoring type surface for overrides.ts.
//
// These ambient `declare global` signatures type the tree-sitter-INJECTED DSL
// globals (`seq`/`choice`/`field`/…) over the sittir-owned `AuthoringRule`
// vocabulary (grammar-shapes nodes + bare literals), so authoring in overrides.ts
// composes into the recursive node types and gets IntelliSense.
//
// Why our own `AuthoringRule` and not tree-sitter's `RuleOrLiteral`: our node
// types are READONLY tuples (needed for the `as const` emit + path indexing),
// which are NOT assignable to tree-sitter's MUTABLE `Rule`. Declaring the params
// over `AuthoringRule` lets our nodes compose into each other (the mismatch that
// otherwise breaks `seq(choice(...))`). These merge with tree-sitter's ambient
// `declare function seq` as overloads; ours matches the grammar-shapes args.
// Scoped to overrides via tsconfig.overrides.json; codegen internals untouched.
//
// The declared set mirrors EXACTLY the runtime globals sittir injects
// (compiler/evaluate.ts saveAndInjectDslGlobals): grammar, seq, choice,
// optional, repeat, repeat1, sym, string, field, token, prec, alias, blank.
// Do not declare a global here without a runtime counterpart there — a
// bare-literal already types as `Str<S>` via `AuthoringRuleToNode`, so no
// `str()`/`pattern()` wrappers exist (or are needed) at runtime.
import type {
	Seq,
	Choice,
	Field,
	Repeat,
	Repeat1,
	Token,
	Alias,
	AuthoringRule,
	AuthoringRuleToNode,
	AuthoringRulesToRules,
	Sym,
	Str,
	Prec,
	PrecLeft,
	PrecRight,
	PrecDynamic,
	ImmediateToken,
	Blank
} from '../grammar-shapes/grammar-json.ts';

declare global {
	function seq<M extends readonly AuthoringRule[]>(...members: M): Seq<AuthoringRulesToRules<M>>;
	function choice<M extends readonly AuthoringRule[]>(...members: M): Choice<AuthoringRulesToRules<M>>;
	function field<const N extends string, R extends AuthoringRule>(name: N, rule: R): Field<N, AuthoringRuleToNode<R>>;
	function optional<R extends AuthoringRule>(rule: R): Choice<[AuthoringRuleToNode<R>, Blank]>;
	function repeat<R extends AuthoringRule>(rule: R): Repeat<AuthoringRuleToNode<R>>;
	function repeat1<R extends AuthoringRule>(rule: R): Repeat1<AuthoringRuleToNode<R>>;

	// `token` / `prec` are callable VALUES with method properties, so they are
	// declared `const` with per-call-signature generics (an `interface` here
	// would declare a type, not the global value, and a generic param on the
	// container would make bare `token(...)` uninstantiable).
	const token: {
		<R extends AuthoringRule>(rule: R): Token<AuthoringRuleToNode<R>>;
		immediate<R extends AuthoringRule>(rule: R): ImmediateToken<AuthoringRuleToNode<R>>;
	};
	const prec: {
		<R extends AuthoringRule>(value: number | string, rule: R): Prec<AuthoringRuleToNode<R>>;
		left<R extends AuthoringRule>(value: number | string, rule: R): PrecLeft<AuthoringRuleToNode<R>>;
		right<R extends AuthoringRule>(value: number | string, rule: R): PrecRight<AuthoringRuleToNode<R>>;
		dynamic<R extends AuthoringRule>(value: number, rule: R): PrecDynamic<AuthoringRuleToNode<R>>;
	};

	function alias<R extends AuthoringRule, V extends string>(rule: R, value: V | Sym<V>): Alias<V, AuthoringRuleToNode<R>>;

	function sym<N extends string>(name: N): Sym<N>;

	/** Runtime-injected `string()` literal wrapper (see saveAndInjectDslGlobals). */
	function string<const S extends string>(value: S): Str<S>;

	function blank(): Blank;
}

export {};
