// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';

import type * as V from './index.ts';

export interface Element<G extends GrammarContext> {
	readonly kind:
		| 'element.jsx.attribute'
		| 'element.macro.fragment'
		| 'element.macro.token_binding'
		| 'element.macro.token_repetition'
		| 'element.macro.token_repetition.pattern'
		| 'element.macro.token_tree'
		| 'element.macro.token_tree.delimited'
		| 'element.macro.token_tree.pattern'
		| 'element.pair'
		| 'element.splat'
		| 'element.splat.dictionary'
		| 'element.splat.parenthesized'
		| 'element.struct.base'
		| 'element.struct.field'
		| 'element.struct.field.shorthand'
		| 'element.template.substitution'
		| 'element.tuple.member'
		| 'element.tuple.member.optional'
		| 'element.type_binding';
}

export namespace Element {
	export interface Jsx<G extends GrammarContext> extends V.Element<G> {
		readonly kind: 'element.jsx.attribute';
	}
	export namespace Jsx {
		export interface Attribute<G extends GrammarContext> extends V.Element.Jsx<G> {
			// claimed by t
			readonly kind: 'element.jsx.attribute';
		}
		export type Kinds<G extends GrammarContext> = V.Element.Jsx.Attribute<G>;
	}
	export interface Macro<G extends GrammarContext> extends V.Element<G> {
		readonly kind:
			| 'element.macro.fragment'
			| 'element.macro.token_binding'
			| 'element.macro.token_repetition'
			| 'element.macro.token_repetition.pattern'
			| 'element.macro.token_tree'
			| 'element.macro.token_tree.delimited'
			| 'element.macro.token_tree.pattern';
	}
	export namespace Macro {
		export interface Fragment<G extends GrammarContext> extends V.Element.Macro<G> {
			// claimed by r
			readonly kind: 'element.macro.fragment';
		}
		export interface TokenBinding<G extends GrammarContext> extends V.Element.Macro<G> {
			// claimed by r
			readonly kind: 'element.macro.token_binding';
			readonly name: V.Identifier.Metavariable<G>;
			readonly type: V.Element.Macro.Fragment<G>;
		}
		export interface TokenRepetition<G extends GrammarContext> extends V.Element.Macro<G> {
			// claimed by r
			readonly kind: 'element.macro.token_repetition' | 'element.macro.token_repetition.pattern';
			readonly operator: '*' | '+' | '?';
			readonly tokens?: (G['identifier'] | G['literal'] | V.Element.Macro.Kinds<G>)[];
		}
		export namespace TokenRepetition {
			export interface Pattern<G extends GrammarContext> extends V.Element.Macro.TokenRepetition<G> {
				// claimed by r
				readonly kind: 'element.macro.token_repetition.pattern';
				readonly operator: '*' | '+' | '?';
				readonly tokenPatterns?: (G['identifier'] | G['literal'] | V.Element.Macro.Kinds<G>)[];
			}
			export type Kinds<G extends GrammarContext> =
				| V.Element.Macro.TokenRepetition<G>
				| V.Element.Macro.TokenRepetition.Pattern<G>;
		}
		export interface TokenTree<G extends GrammarContext> extends V.Element.Macro<G> {
			// claimed by r
			readonly kind:
				| 'element.macro.token_tree'
				| 'element.macro.token_tree.delimited'
				| 'element.macro.token_tree.pattern';
			readonly content:
				| V.Unmapped<'rust:delim_token_tree_brace'>
				| V.Unmapped<'rust:delim_token_tree_bracket'>
				| V.Unmapped<'rust:delim_token_tree_paren'>
				| V.Unmapped<'rust:token_tree_brace'>
				| V.Unmapped<'rust:token_tree_bracket'>
				| V.Unmapped<'rust:token_tree_paren'>
				| V.Unmapped<'rust:token_tree_pattern_brace'>
				| V.Unmapped<'rust:token_tree_pattern_bracket'>
				| V.Unmapped<'rust:token_tree_pattern_paren'>;
			// unmapped: <rust:delim_token_tree_brace> <rust:delim_token_tree_bracket> <rust:delim_token_tree_paren> <rust:token_tree_brace> <rust:token_tree_bracket> <rust:token_tree_paren> <rust:token_tree_pattern_brace> <rust:token_tree_pattern_bracket> <rust:token_tree_pattern_paren>
		}
		export namespace TokenTree {
			export interface Delimited<G extends GrammarContext> extends V.Element.Macro.TokenTree<G> {
				// claimed by r
				readonly kind: 'element.macro.token_tree.delimited';
				readonly content:
					| V.Unmapped<'rust:delim_token_tree_brace'>
					| V.Unmapped<'rust:delim_token_tree_bracket'>
					| V.Unmapped<'rust:delim_token_tree_paren'>;
				// unmapped: <rust:delim_token_tree_brace> <rust:delim_token_tree_bracket> <rust:delim_token_tree_paren>
			}
			export interface Pattern<G extends GrammarContext> extends V.Element.Macro.TokenTree<G> {
				// claimed by r
				readonly kind: 'element.macro.token_tree.pattern';
				readonly content:
					| V.Unmapped<'rust:token_tree_pattern_brace'>
					| V.Unmapped<'rust:token_tree_pattern_bracket'>
					| V.Unmapped<'rust:token_tree_pattern_paren'>;
				// unmapped: <rust:token_tree_pattern_brace> <rust:token_tree_pattern_bracket> <rust:token_tree_pattern_paren>
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
		readonly kind: 'element.pair';
		readonly key: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		readonly value: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
	}
	export interface Splat<G extends GrammarContext> extends V.Element<G> {
		// claimed by pt
		readonly kind: 'element.splat' | 'element.splat.dictionary' | 'element.splat.parenthesized';
		readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
	}
	export namespace Splat {
		export interface Dictionary<G extends GrammarContext> extends V.Element.Splat<G> {
			// claimed by p
			readonly kind: 'element.splat.dictionary';
			readonly expression: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		}
		export interface Parenthesized<G extends GrammarContext> extends V.Element.Splat<G> {
			// claimed by p
			readonly kind: 'element.splat.parenthesized';
			readonly content: V.Element.Splat.Kinds<G>;
		}
		export type Kinds<G extends GrammarContext> =
			| V.Element.Splat<G>
			| V.Element.Splat.Dictionary<G>
			| V.Element.Splat.Parenthesized<G>;
	}
	export interface Struct<G extends GrammarContext> extends V.Element<G> {
		readonly kind: 'element.struct.base' | 'element.struct.field' | 'element.struct.field.shorthand';
	}
	export namespace Struct {
		export interface Base<G extends GrammarContext> extends V.Element.Struct<G> {
			// claimed by r
			readonly kind: 'element.struct.base';
			readonly value: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		}
		export interface Field<G extends GrammarContext> extends V.Element.Struct<G> {
			// claimed by r
			readonly kind: 'element.struct.field' | 'element.struct.field.shorthand';
			readonly attributeItems?: G['attribute'][];
			readonly field?: G['identifier'] | V.Literal.Number.Integer<G>;
			readonly value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		}
		export namespace Field {
			export interface Shorthand<G extends GrammarContext> extends V.Element.Struct.Field<G> {
				// claimed by r
				readonly kind: 'element.struct.field.shorthand';
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
		readonly kind: 'element.template.substitution';
		readonly content: G['identifier'] | G['type'];
		// t only
	}
	export namespace Template {
		export interface Substitution<G extends GrammarContext> extends V.Element.Template<G> {
			// claimed by t
			readonly kind: 'element.template.substitution';
			readonly content: G['identifier'] | G['type'];
		}
		export type Kinds<G extends GrammarContext> = V.Element.Template.Substitution<G>;
	}
	export interface Tuple<G extends GrammarContext> extends V.Element<G> {
		readonly kind: 'element.tuple.member' | 'element.tuple.member.optional';
		readonly name: G['identifier'] | V.Pattern.Rest<G>;
		// t only
		readonly type: G['type'];
		// t only
	}
	export namespace Tuple {
		export interface Member<G extends GrammarContext> extends V.Element.Tuple<G> {
			// claimed by t
			readonly kind: 'element.tuple.member' | 'element.tuple.member.optional';
			readonly name: G['identifier'] | V.Pattern.Rest<G>;
			readonly type: G['type'];
		}
		export namespace Member {
			export interface Optional<G extends GrammarContext> extends V.Element.Tuple.Member<G> {
				// claimed by t
				readonly kind: 'element.tuple.member.optional';
				readonly name: G['identifier'];
				readonly type: G['type'];
			}
			export type Kinds<G extends GrammarContext> = V.Element.Tuple.Member<G> | V.Element.Tuple.Member.Optional<G>;
		}
		export type Kinds<G extends GrammarContext> = V.Element.Tuple.Member<G> | V.Element.Tuple.Member.Optional<G>;
	}
	export interface TypeBinding<G extends GrammarContext> extends V.Element<G> {
		// claimed by r
		readonly kind: 'element.type_binding';
		readonly name: G['identifier'];
		readonly type: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
		readonly typeArguments?: G['type'][];
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
