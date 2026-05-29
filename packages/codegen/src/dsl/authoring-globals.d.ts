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
import type {
	Seq,
	Choice,
	Field,
	Repeat,
	Repeat1,
	Token,
	GrammarNode,
	AuthoringRule,
} from '../grammar-shapes/grammar-json.ts';

declare global {
	function seq(...members: readonly AuthoringRule[]): Seq<readonly GrammarNode[]>;
	function choice(...members: readonly AuthoringRule[]): Choice<readonly GrammarNode[]>;
	function field<const N extends string>(name: N, rule: AuthoringRule): Field<N, GrammarNode>;
	function optional(rule: AuthoringRule): Choice<readonly GrammarNode[]>;
	function repeat(rule: AuthoringRule): Repeat<GrammarNode>;
	function repeat1(rule: AuthoringRule): Repeat1<GrammarNode>;
	function token(rule: AuthoringRule): Token<GrammarNode>;
}

export {};
