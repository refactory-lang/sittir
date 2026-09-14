// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';
import type * as V from './index.ts';

export interface Type<G extends GrammarContext> {
	// claimed by p
	readonly abstract?: boolean; // t only
	readonly alias?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type']; // r only
	readonly alternative?: G['identifier'] | G['type']; // t only
	readonly baseType?: G['type'];
	readonly closing?: '|}' | '}'; // t only
	readonly consequence?: G['identifier'] | G['type']; // t only
	readonly constraint?: G['type'];
	readonly content?:
		| V.Unmapped<'rust:function_type_fn_form'>
		| V.Unmapped<'rust:function_type_trait_form'>
		| V.Unmapped<'typescript:__number'>
		| V.Unmapped<'typescript:type_query_call_expression'>
		| V.Unmapped<'typescript:type_query_instantiation_expression'>
		| V.Unmapped<'typescript:type_query_member_expression'>
		| V.Unmapped<'typescript:type_query_subscript_expression'>
		| V.Clause.Bounds.Removed<G>
		| G['expression']
		| G['identifier']
		| G['literal']
		| G['pattern']
		| 'const'
		| 'mut'
		| G['type']; // prt only   // unmapped: <rust:function_type_fn_form> <rust:function_type_trait_form> <typescript:__number> <typescript:type_query_call_expression> <typescript:type_query_instantiation_expression> <typescript:type_query_member_expression> <typescript:type_query_subscript_expression>
	readonly element?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type']; // r only
	readonly elements?: (V.Unmapped<'typescript:template_chars'> | V.Element.Template.Substitution<G>)[]; // t only   // unmapped: <typescript:template_chars>
	readonly forLifetimes?: V.Clause.Lifetimes<G>; // r only
	readonly indexType?: G['identifier'] | G['type']; // t only
	readonly left?: V.Expression.Call.Macro<G> | G['identifier'] | V.Clause.Bounds.Kinds<G> | G['type']; // prt only
	readonly length?: G['expression'] | G['identifier'] | G['literal'] | G['statement']; // r only
	readonly lifetime?: V.Identifier.Lifetime<G>; // r only
	readonly members?: G['declaration'][]; // t only
	readonly mutableSpecifier?: boolean; // r only
	readonly name?: G['identifier']; // prt only   // unmapped: literal:Unique
	readonly opening?: '{' | '{|'; // t only
	readonly operator?: '*' | '**';
	readonly parameters?: V.Declaration.Parameter<G>[]; // rt only
	readonly path?: G['identifier'] | G['type']; // r only
	readonly returnType?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type']; // rt only
	readonly right?: V.Expression.Call.Macro<G> | G['identifier'] | V.Clause.Bounds.Kinds<G> | G['type']; // prt only
	readonly trait?: G['identifier'] | V.Clause.Bounds.Kinds<G> | G['type']; // r only
	readonly tupleTypeElements?: V.Unmapped<'rust:tuple_type_elements'>; // r only   // unmapped: <rust:tuple_type_elements>
	readonly tupleTypeMembers?: V.Unmapped<'typescript:tuple_type_members'>; // t only   // unmapped: <typescript:tuple_type_members>
	readonly type?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type']; // rt only
	readonly typeArguments?: G['type'][]; // rt only
	readonly typeParameter?: V.Declaration.Parameter.Type<G>;
	readonly typeParameters?: V.Declaration.Parameter.Type<G>[]; // rt only
}
export namespace Type {
	export interface Abstract<G extends GrammarContext> extends V.Type<G> {
		// claimed by r
		readonly trait: V.Clause.Bounds.Removed<G> | G['identifier'] | G['type'];
		readonly typeParameters?: V.Declaration.Parameter.Type<G>[];
	}
	export interface Array<G extends GrammarContext> extends V.Type<G> {
		// claimed by rt
		readonly element?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type']; // r only
		readonly length?: G['expression'] | G['identifier'] | G['literal'] | G['statement']; // r only
		readonly type?: G['identifier'] | G['type']; // t only
	}
	export interface Bounded<G extends GrammarContext> extends V.Type<G> {
		// claimed by r
		readonly left: V.Expression.Call.Macro<G> | G['identifier'] | V.Clause.Bounds.Kinds<G> | G['type'];
		readonly right: V.Expression.Call.Macro<G> | G['identifier'] | V.Clause.Bounds.Kinds<G> | G['type'];
	}
	export interface Bracketed<G extends GrammarContext> extends V.Type<G> {
		// claimed by r
		readonly content: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
	}
	export interface Conditional<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly alternative: G['identifier'] | G['type'];
		readonly consequence: G['identifier'] | G['type'];
		readonly left: G['identifier'] | G['type'];
		readonly right: G['identifier'] | G['type'];
	}
	export interface Constrained<G extends GrammarContext> extends V.Type<G> {
		// claimed by p
		readonly baseType: G['type'];
		readonly constraint: G['type'];
	}
	export interface Dynamic<G extends GrammarContext> extends V.Type<G> {
		// claimed by r
		readonly trait: V.Clause.Bounds.HigherRanked<G> | G['identifier'] | G['type'];
	}
	export interface Existential<G extends GrammarContext> extends V.Type<G> {} // claimed by t
	export interface Function<G extends GrammarContext> extends V.Type<G> {
		// claimed by rt
		readonly abstract?: boolean; // t only
		readonly content?: V.Unmapped<'rust:function_type_fn_form'> | V.Unmapped<'rust:function_type_trait_form'>; // r only   // unmapped: <rust:function_type_fn_form> <rust:function_type_trait_form>
		readonly forLifetimes?: V.Clause.Lifetimes<G>; // r only
		readonly parameters: V.Declaration.Parameter<G>[];
		readonly returnType?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
		readonly type?: G['identifier'] | G['type']; // t only
		readonly typeParameters?: V.Declaration.Parameter.Type<G>[]; // t only
	}
	export namespace Function {
		export interface Constructor<G extends GrammarContext> extends V.Type.Function<G> {
			// claimed by t
			readonly abstract?: boolean;
			readonly parameters: V.Declaration.Parameter<G>[];
			readonly type: G['identifier'] | G['type'];
			readonly typeParameters?: V.Declaration.Parameter.Type<G>[];
		}
		export type Kinds<G extends GrammarContext> = V.Type.Function<G> | V.Type.Function.Constructor<G>;
	}
	export interface Generic<G extends GrammarContext> extends V.Type<G> {
		// claimed by prt
		readonly name?: G['identifier']; // pt only
		readonly type?: G['identifier'] | V.Type.Scoped<G>; // r only
		readonly typeArguments?: G['type'][]; // rt only
		readonly typeParameter?: V.Declaration.Parameter.Type<G>; // p only
	}
	export namespace Generic {
		export interface Turbofish<G extends GrammarContext> extends V.Type.Generic<G> {
			// claimed by r
			readonly type: G['identifier'];
			readonly typeArguments: G['type'][];
		}
		export type Kinds<G extends GrammarContext> = V.Type.Generic<G> | V.Type.Generic.Turbofish<G>;
	}
	export interface IndexQuery<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly type: G['identifier'] | G['type'];
	}
	export interface Infer<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly name: G['identifier'];
		readonly type?: G['identifier'] | G['type'];
	}
	export interface Intersection<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly left?: G['identifier'] | G['type'];
		readonly right: G['identifier'] | G['type'];
	}
	export interface Literal<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly content: V.Unmapped<'typescript:__number'> | G['literal']; // unmapped: <typescript:__number>
	}
	export interface Lookup<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly indexType: G['identifier'] | G['type'];
		readonly type: G['identifier'] | G['type'];
	}
	export interface Maybe<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly type: G['identifier'] | G['type'];
	}
	export interface Member<G extends GrammarContext> extends V.Type<G> {
		// claimed by p
		readonly baseType: G['type'];
		readonly name: G['identifier'];
	}
	export interface Named<G extends GrammarContext> extends V.Type<G> {}
	export namespace Named {
		export interface Prelude<G extends GrammarContext> extends V.Type.Named<G> {} // claimed by r
		export type Kinds<G extends GrammarContext> = V.Type.Named.Prelude<G>;
	}
	export interface Never<G extends GrammarContext> extends V.Type<G> {} // claimed by r
	export interface Object<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly closing: '|}' | '}';
		readonly members?: G['declaration'][];
		readonly opening: '{' | '{|';
	}
	export interface Optional<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly type: G['identifier'] | G['type'];
	}
	export interface Parenthesized<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly type: G['identifier'] | G['type'];
	}
	export interface Pointer<G extends GrammarContext> extends V.Type<G> {
		// claimed by r
		readonly content: 'const' | 'mut';
		readonly type: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
	}
	export interface Predicate<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly content?: G['identifier'] | V.Type.Predicate<G>;
		readonly name?: G['identifier']; // unmapped: literal:Unique
		readonly type?: G['identifier'] | G['type'];
	}
	export namespace Predicate {
		export interface Asserts<G extends GrammarContext> extends V.Type.Predicate<G> {
			// claimed by t
			readonly content: G['identifier'] | V.Type.Predicate<G>;
		}
		export type Kinds<G extends GrammarContext> = V.Type.Predicate<G> | V.Type.Predicate.Asserts<G>;
	}
	export interface Primitive<G extends GrammarContext> extends V.Type<G> {} // claimed by rt
	export interface Qualified<G extends GrammarContext> extends V.Type<G> {
		// claimed by r
		readonly alias: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
		readonly type: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
	}
	export interface Query<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly content:
			| V.Unmapped<'typescript:type_query_call_expression'>
			| V.Unmapped<'typescript:type_query_instantiation_expression'>
			| V.Unmapped<'typescript:type_query_member_expression'>
			| V.Unmapped<'typescript:type_query_subscript_expression'>
			| G['identifier']; // unmapped: <typescript:type_query_call_expression> <typescript:type_query_instantiation_expression> <typescript:type_query_member_expression> <typescript:type_query_subscript_expression>
	}
	export interface Readonly<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly type: G['identifier'] | G['type'];
	}
	export interface Reference<G extends GrammarContext> extends V.Type<G> {
		// claimed by r
		readonly lifetime?: V.Identifier.Lifetime<G>;
		readonly mutableSpecifier?: boolean;
		readonly type: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
	}
	export interface Rest<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly type: G['identifier'] | G['type'];
	}
	export interface Scoped<G extends GrammarContext> extends V.Type<G> {
		// claimed by r
		readonly name: G['identifier'];
		readonly path?: G['identifier'] | G['type'];
	}
	export namespace Scoped {
		export interface Expression<G extends GrammarContext> extends V.Type.Scoped<G> {
			// claimed by r
			readonly name: G['identifier'];
			readonly path?: G['identifier'] | V.Type.Generic.Turbofish<G>;
		}
		export type Kinds<G extends GrammarContext> = V.Type.Scoped<G> | V.Type.Scoped.Expression<G>;
	}
	export interface Splat<G extends GrammarContext> extends V.Type<G> {
		// claimed by p
		readonly name: G['identifier'];
		readonly operator: '*' | '**';
	}
	export interface Template<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly elements?: (V.Unmapped<'typescript:template_chars'> | V.Element.Template.Substitution<G>)[]; // unmapped: <typescript:template_chars>
	}
	export interface Tuple<G extends GrammarContext> extends V.Type<G> {
		// claimed by rt
		readonly tupleTypeElements?: V.Unmapped<'rust:tuple_type_elements'>; // r only   // unmapped: <rust:tuple_type_elements>
		readonly tupleTypeMembers?: V.Unmapped<'typescript:tuple_type_members'>; // t only   // unmapped: <typescript:tuple_type_members>
	}
	export interface Union<G extends GrammarContext> extends V.Type<G> {
		// claimed by pt
		readonly left?: G['identifier'] | G['type'];
		readonly right: G['identifier'] | G['type'];
	}
	export interface Unit<G extends GrammarContext> extends V.Type<G> {} // claimed by r
	export type Kinds<G extends GrammarContext> =
		| V.Type<G>
		| V.Type.Abstract<G>
		| V.Type.Array<G>
		| V.Type.Bounded<G>
		| V.Type.Bracketed<G>
		| V.Type.Conditional<G>
		| V.Type.Constrained<G>
		| V.Type.Dynamic<G>
		| V.Type.Existential<G>
		| V.Type.Function<G>
		| V.Type.Function.Constructor<G>
		| V.Type.Generic<G>
		| V.Type.Generic.Turbofish<G>
		| V.Type.IndexQuery<G>
		| V.Type.Infer<G>
		| V.Type.Intersection<G>
		| V.Type.Literal<G>
		| V.Type.Lookup<G>
		| V.Type.Maybe<G>
		| V.Type.Member<G>
		| V.Type.Named.Prelude<G>
		| V.Type.Never<G>
		| V.Type.Object<G>
		| V.Type.Optional<G>
		| V.Type.Parenthesized<G>
		| V.Type.Pointer<G>
		| V.Type.Predicate<G>
		| V.Type.Predicate.Asserts<G>
		| V.Type.Primitive<G>
		| V.Type.Qualified<G>
		| V.Type.Query<G>
		| V.Type.Readonly<G>
		| V.Type.Reference<G>
		| V.Type.Rest<G>
		| V.Type.Scoped<G>
		| V.Type.Scoped.Expression<G>
		| V.Type.Splat<G>
		| V.Type.Template<G>
		| V.Type.Tuple<G>
		| V.Type.Union<G>
		| V.Type.Unit<G>;
}
