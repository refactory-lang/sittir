// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';
import type * as V from './index.ts';

export interface Element<G extends GrammarContext> {
	readonly attributeItem?: G['attribute'][]; // r only
	readonly attributes?: G['attribute'][]; // r only
	readonly content?:
		| V.Unmapped<'rust:delim_token_tree_brace'>
		| V.Unmapped<'rust:delim_token_tree_bracket'>
		| V.Unmapped<'rust:delim_token_tree_paren'>
		| V.Unmapped<'rust:token_tree_brace'>
		| V.Unmapped<'rust:token_tree_bracket'>
		| V.Unmapped<'rust:token_tree_paren'>
		| V.Unmapped<'rust:token_tree_pattern_brace'>
		| V.Unmapped<'rust:token_tree_pattern_bracket'>
		| V.Unmapped<'rust:token_tree_pattern_paren'>
		| G['identifier']
		| V.Element.Splat.Kinds<G>
		| G['type']; // prt only   // unmapped: <rust:delim_token_tree_brace> <rust:delim_token_tree_bracket> <rust:delim_token_tree_paren> <rust:token_tree_brace> <rust:token_tree_bracket> <rust:token_tree_paren> <rust:token_tree_pattern_brace> <rust:token_tree_pattern_bracket> <rust:token_tree_pattern_paren>
	readonly default?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal']; // t only
	readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // pt only
	readonly heritage?: V.Clause.Annotation<G>; // t only
	readonly key?:
		| V.Unmapped<'typescript:__property_identifier'>
		| G['expression']
		| G['identifier']
		| G['literal']
		| G['pattern']; // pt only   // unmapped: <typescript:__property_identifier>
	readonly name?: G['identifier'] | V.Pattern.Rest<G>; // rt only
	readonly object?: G['expression'] | G['identifier'] | G['literal'] | G['pattern'] | G['statement']; // pr only
	readonly operator?: '*' | '+' | '?'; // r only
	readonly property?: G['identifier'] | V.Literal.Number.Integer<G>; // r only
	readonly tokens?: (G['identifier'] | G['literal'] | V.Element.Macro.Kinds<G> | V.Type.Primitive<G>)[]; // r only
	readonly typeArguments?: G['type'][]; // r only
	readonly value?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | number | G['type']; // r only
}
export namespace Element {
	export interface Jsx<G extends GrammarContext> extends V.Element<G> {}
	export namespace Jsx {
		export interface Attribute<G extends GrammarContext> extends V.Element.Jsx<G> {} // claimed by t
		export type Kinds<G extends GrammarContext> = V.Element.Jsx.Attribute<G>;
	}
	export interface Macro<G extends GrammarContext> extends V.Element<G> {
		readonly content?:
			| V.Unmapped<'rust:delim_token_tree_brace'>
			| V.Unmapped<'rust:delim_token_tree_bracket'>
			| V.Unmapped<'rust:delim_token_tree_paren'>
			| V.Unmapped<'rust:token_tree_brace'>
			| V.Unmapped<'rust:token_tree_bracket'>
			| V.Unmapped<'rust:token_tree_paren'>
			| V.Unmapped<'rust:token_tree_pattern_brace'>
			| V.Unmapped<'rust:token_tree_pattern_bracket'>
			| V.Unmapped<'rust:token_tree_pattern_paren'>; // r only   // unmapped: <rust:delim_token_tree_brace> <rust:delim_token_tree_bracket> <rust:delim_token_tree_paren> <rust:token_tree_brace> <rust:token_tree_bracket> <rust:token_tree_paren> <rust:token_tree_pattern_brace> <rust:token_tree_pattern_bracket> <rust:token_tree_pattern_paren>
		readonly name?: V.Identifier.Metavariable<G>; // r only
		readonly operator?: '*' | '+' | '?'; // r only
		readonly tokens?: (G['identifier'] | G['literal'] | V.Element.Macro.Kinds<G> | V.Type.Primitive<G>)[]; // r only
		readonly value?: number; // r only
	}
	export namespace Macro {
		export interface Fragment<G extends GrammarContext> extends V.Element.Macro<G> {} // claimed by r
		export interface TokenBinding<G extends GrammarContext> extends V.Element.Macro<G> {
			// claimed by r
			readonly name: V.Identifier.Metavariable<G>;
			readonly value: number;
		}
		export interface TokenRepetition<G extends GrammarContext> extends V.Element.Macro<G> {
			// claimed by r
			readonly operator: '*' | '+' | '?';
			readonly tokens?: (G['identifier'] | G['literal'] | V.Element.Macro.Kinds<G> | V.Type.Primitive<G>)[];
		}
		export namespace TokenRepetition {
			export interface Pattern<G extends GrammarContext> extends V.Element.Macro.TokenRepetition<G> {
				// claimed by r
				readonly operator: '*' | '+' | '?';
			}
			export type Kinds<G extends GrammarContext> =
				| V.Element.Macro.TokenRepetition<G>
				| V.Element.Macro.TokenRepetition.Pattern<G>;
		}
		export interface TokenTree<G extends GrammarContext> extends V.Element.Macro<G> {
			// claimed by r
			readonly content:
				| V.Unmapped<'rust:delim_token_tree_brace'>
				| V.Unmapped<'rust:delim_token_tree_bracket'>
				| V.Unmapped<'rust:delim_token_tree_paren'>
				| V.Unmapped<'rust:token_tree_brace'>
				| V.Unmapped<'rust:token_tree_bracket'>
				| V.Unmapped<'rust:token_tree_paren'>
				| V.Unmapped<'rust:token_tree_pattern_brace'>
				| V.Unmapped<'rust:token_tree_pattern_bracket'>
				| V.Unmapped<'rust:token_tree_pattern_paren'>; // unmapped: <rust:delim_token_tree_brace> <rust:delim_token_tree_bracket> <rust:delim_token_tree_paren> <rust:token_tree_brace> <rust:token_tree_bracket> <rust:token_tree_paren> <rust:token_tree_pattern_brace> <rust:token_tree_pattern_bracket> <rust:token_tree_pattern_paren>
		}
		export namespace TokenTree {
			export interface Delimited<G extends GrammarContext> extends V.Element.Macro.TokenTree<G> {
				// claimed by r
				readonly content:
					| V.Unmapped<'rust:delim_token_tree_brace'>
					| V.Unmapped<'rust:delim_token_tree_bracket'>
					| V.Unmapped<'rust:delim_token_tree_paren'>; // unmapped: <rust:delim_token_tree_brace> <rust:delim_token_tree_bracket> <rust:delim_token_tree_paren>
			}
			export interface Pattern<G extends GrammarContext> extends V.Element.Macro.TokenTree<G> {
				// claimed by r
				readonly content:
					| V.Unmapped<'rust:token_tree_pattern_brace'>
					| V.Unmapped<'rust:token_tree_pattern_bracket'>
					| V.Unmapped<'rust:token_tree_pattern_paren'>; // unmapped: <rust:token_tree_pattern_brace> <rust:token_tree_pattern_bracket> <rust:token_tree_pattern_paren>
			}
			export type Kinds<G extends GrammarContext> =
				| V.Element.Macro.TokenTree<G>
				| V.Element.Macro.TokenTree.Delimited<G>
				| V.Element.Macro.TokenTree.Pattern<G>;
		}
		export type Kinds<G extends GrammarContext> =
			| V.Element.Macro.Fragment<G>
			| V.Element.Macro.TokenBinding<G>
			| V.Element.Macro.TokenRepetition<G>
			| V.Element.Macro.TokenRepetition.Pattern<G>
			| V.Element.Macro.TokenTree<G>
			| V.Element.Macro.TokenTree.Delimited<G>
			| V.Element.Macro.TokenTree.Pattern<G>;
	}
	export interface Pair<G extends GrammarContext> extends V.Element<G> {
		// claimed by pt
		readonly default?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal']; // t only
		readonly key:
			| V.Unmapped<'typescript:__property_identifier'>
			| G['expression']
			| G['identifier']
			| G['literal']
			| G['pattern']; // unmapped: <typescript:__property_identifier>
		readonly object?: G['expression'] | G['identifier'] | G['literal'] | G['pattern']; // p only
	}
	export interface Splat<G extends GrammarContext> extends V.Element<G> {
		// claimed by pt
		readonly content?: V.Element.Splat.Kinds<G>; // p only
		readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
	}
	export namespace Splat {
		export interface Dictionary<G extends GrammarContext> extends V.Element.Splat<G> {
			// claimed by p
			readonly expression: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		}
		export interface Parenthesized<G extends GrammarContext> extends V.Element.Splat<G> {
			// claimed by p
			readonly content: V.Element.Splat.Kinds<G>;
		}
		export type Kinds<G extends GrammarContext> =
			| V.Element.Splat<G>
			| V.Element.Splat.Dictionary<G>
			| V.Element.Splat.Parenthesized<G>;
	}
	export interface Struct<G extends GrammarContext> extends V.Element<G> {
		readonly attributeItem?: G['attribute'][]; // r only
		readonly attributes?: G['attribute'][]; // r only
		readonly name?: G['identifier']; // r only
		readonly object?: G['expression'] | G['identifier'] | G['literal'] | G['statement']; // r only
		readonly property?: G['identifier'] | V.Literal.Number.Integer<G>; // r only
	}
	export namespace Struct {
		export interface Base<G extends GrammarContext> extends V.Element.Struct<G> {
			// claimed by r
			readonly object: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		}
		export interface Field<G extends GrammarContext> extends V.Element.Struct<G> {
			// claimed by r
			readonly attributeItem?: G['attribute'][];
			readonly attributes?: G['attribute'][];
			readonly name?: G['identifier'];
			readonly object?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
			readonly property?: G['identifier'] | V.Literal.Number.Integer<G>;
		}
		export namespace Field {
			export interface Shorthand<G extends GrammarContext> extends V.Element.Struct.Field<G> {
				// claimed by r
				readonly attributes?: G['attribute'][];
				readonly name: G['identifier'];
			}
			export type Kinds<G extends GrammarContext> = V.Element.Struct.Field<G> | V.Element.Struct.Field.Shorthand<G>;
		}
		export type Kinds<G extends GrammarContext> =
			| V.Element.Struct.Base<G>
			| V.Element.Struct.Field<G>
			| V.Element.Struct.Field.Shorthand<G>;
	}
	export interface Template<G extends GrammarContext> extends V.Element<G> {
		readonly content?: G['identifier'] | G['type']; // t only
	}
	export namespace Template {
		export interface Substitution<G extends GrammarContext> extends V.Element.Template<G> {
			// claimed by t
			readonly content: G['identifier'] | G['type'];
		}
		export type Kinds<G extends GrammarContext> = V.Element.Template.Substitution<G>;
	}
	export interface Tuple<G extends GrammarContext> extends V.Element<G> {
		readonly heritage?: V.Clause.Annotation<G>; // t only
		readonly name?: G['identifier'] | V.Pattern.Rest<G>; // t only
	}
	export namespace Tuple {
		export interface Member<G extends GrammarContext> extends V.Element.Tuple<G> {
			// claimed by t
			readonly heritage: V.Clause.Annotation<G>;
			readonly name: G['identifier'] | V.Pattern.Rest<G>;
		}
		export namespace Member {
			export interface Optional<G extends GrammarContext> extends V.Element.Tuple.Member<G> {
				// claimed by t
				readonly heritage: V.Clause.Annotation<G>;
				readonly name: G['identifier'];
			}
			export type Kinds<G extends GrammarContext> = V.Element.Tuple.Member<G> | V.Element.Tuple.Member.Optional<G>;
		}
		export type Kinds<G extends GrammarContext> = V.Element.Tuple.Member<G> | V.Element.Tuple.Member.Optional<G>;
	}
	export interface TypeBinding<G extends GrammarContext> extends V.Element<G> {
		// claimed by r
		readonly name: G['identifier'];
		readonly typeArguments?: G['type'][];
		readonly value: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
	}
	export type Kinds<G extends GrammarContext> =
		| V.Element.Jsx.Attribute<G>
		| V.Element.Macro.Fragment<G>
		| V.Element.Macro.TokenBinding<G>
		| V.Element.Macro.TokenRepetition<G>
		| V.Element.Macro.TokenRepetition.Pattern<G>
		| V.Element.Macro.TokenTree<G>
		| V.Element.Macro.TokenTree.Delimited<G>
		| V.Element.Macro.TokenTree.Pattern<G>
		| V.Element.Pair<G>
		| V.Element.Splat<G>
		| V.Element.Splat.Dictionary<G>
		| V.Element.Splat.Parenthesized<G>
		| V.Element.Struct.Base<G>
		| V.Element.Struct.Field<G>
		| V.Element.Struct.Field.Shorthand<G>
		| V.Element.Template.Substitution<G>
		| V.Element.Tuple.Member<G>
		| V.Element.Tuple.Member.Optional<G>
		| V.Element.TypeBinding<G>;
}
