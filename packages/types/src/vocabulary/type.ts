// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';

import type * as V from './index.ts';

export interface Type<G extends GrammarContext> {
	// claimed by p
	readonly kind: 'type';
	readonly content?:
		| V.Unmapped<'rust:function_type_fn_form'>
		| V.Unmapped<'rust:function_type_trait_form'>
		| V.Unmapped<'typescript:type_query_call_expression'>
		| V.Unmapped<'typescript:type_query_instantiation_expression'>
		| V.Unmapped<'typescript:type_query_member_expression'>
		| V.Unmapped<'typescript:type_query_subscript_expression'>
		| V.Clause.Bounds.Removed<G>
		| G['expression']
		| G['identifier']
		| G['literal']
		| G['pattern']
		| G['type'];
	// prt only
	// unmapped: <rust:function_type_fn_form> <rust:function_type_trait_form> <typescript:type_query_call_expression> <typescript:type_query_instantiation_expression> <typescript:type_query_member_expression> <typescript:type_query_subscript_expression>
}

export namespace Type {
	export interface Abstract<G extends GrammarContext> extends V.Type<G> {
		// claimed by r
		readonly kind: 'type.abstract';
		readonly trait: V.Clause.Bounds.Removed<G> | G['identifier'] | G['type'];
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
	}
	export interface Array<G extends GrammarContext> extends V.Type<G> {
		// claimed by rt
		readonly kind: 'type.array';
		readonly element?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
		// r only
		readonly length?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
		// r only
		readonly type?: G['identifier'] | G['type'];
		// t only
	}
	export interface Bounded<G extends GrammarContext> extends V.Type<G> {
		// claimed by r
		readonly kind: 'type.bounded';
		readonly left: V.Expression.Call.Macro<G> | G['identifier'] | V.Clause.Bounds.Any<G> | G['type'];
		readonly right: V.Expression.Call.Macro<G> | G['identifier'] | V.Clause.Bounds.Any<G> | G['type'];
	}
	export interface Bracketed<G extends GrammarContext> extends V.Type<G> {
		// claimed by r
		readonly kind: 'type.bracketed';
		readonly content: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
	}
	export interface Conditional<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly kind: 'type.conditional';
		readonly alternative: G['identifier'] | G['type'];
		readonly consequence: G['identifier'] | G['type'];
		readonly left: G['identifier'] | G['type'];
		readonly right: G['identifier'] | G['type'];
	}
	export interface Constrained<G extends GrammarContext> extends V.Type<G> {
		// claimed by p
		readonly kind: 'type.constrained';
		readonly baseType: G['type'];
		readonly constraint: G['type'];
	}
	export interface Dynamic<G extends GrammarContext> extends V.Type<G> {
		// claimed by r
		readonly kind: 'type.dynamic';
		readonly trait: V.Clause.Bounds.HigherRanked<G> | G['identifier'] | G['type'];
	}
	export interface Existential<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly kind: 'type.existential';
	}
	export interface Function<G extends GrammarContext> extends V.Type<G> {
		// claimed by rt
		readonly kind: 'type.function';
		readonly content?: V.Unmapped<'rust:function_type_fn_form'> | V.Unmapped<'rust:function_type_trait_form'>;
		// r only
		// unmapped: <rust:function_type_fn_form> <rust:function_type_trait_form>
		readonly forLifetimes?: V.Clause.Lifetimes<G>;
		// r only
		readonly parameters: V.Declaration.Parameter<G>[];
		readonly returnType?: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		// t only
	}
	export namespace Function {
		export interface Constructor<G extends GrammarContext> extends V.Type.Function<G> {
			// claimed by t
			readonly kind: 'type.function.constructor';
			readonly abstract?: boolean;
			readonly parameters: V.Declaration.Parameter<G>[];
			readonly type: G['identifier'] | G['type'];
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export type Any<G extends GrammarContext> = V.Type.Function<G> | V.Type.Function.Constructor<G>;
	}
	export interface Generic<G extends GrammarContext> extends V.Type<G> {
		// claimed by prt
		readonly kind: 'type.generic';
		readonly name?: G['identifier'] | 'type' | V.Type.Path<G>;
		// pt only
		readonly type?: G['identifier'] | V.Type.Path<G>;
		// r only
		readonly typeArguments?: G['type'][];
		// rt only
		readonly typeParameter?: V.Declaration.TypeParameter<G>;
		// p only
	}
	export namespace Generic {
		export interface Turbofish<G extends GrammarContext> extends V.Type.Generic<G> {
			// claimed by r
			readonly kind: 'type.generic.turbofish';
			readonly type: G['identifier'];
			readonly typeArguments: G['type'][];
		}
		export type Any<G extends GrammarContext> = V.Type.Generic<G> | V.Type.Generic.Turbofish<G>;
	}
	export interface IndexQuery<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly kind: 'type.index_query';
		readonly type: G['identifier'] | G['type'];
	}
	export interface Infer<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly kind: 'type.infer';
		readonly name: G['identifier'];
		readonly type?: G['identifier'] | G['type'];
	}
	export interface Intersection<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly kind: 'type.intersection';
		readonly left?: G['identifier'] | G['type'];
		readonly right: G['identifier'] | G['type'];
	}
	export interface Literal<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly kind: 'type.literal';
		readonly content: G['literal'];
	}
	export interface Lookup<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly kind: 'type.lookup';
		readonly indexType: G['identifier'] | G['type'];
		readonly type: G['identifier'] | G['type'];
	}
	export interface Maybe<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly kind: 'type.maybe';
		readonly type: G['identifier'] | G['type'];
	}
	export interface Named<G extends GrammarContext> extends V.Type<G> {
		readonly kind: 'type.named';
	}
	export namespace Named {
		export interface Prelude<G extends GrammarContext> extends V.Type.Named<G> {
			// claimed by r
			readonly kind: 'type.named.prelude';
		}
		export type Any<G extends GrammarContext> = V.Type.Named.Prelude<G>;
	}
	export interface Object<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly kind: 'type.object';
		readonly closing: '|}' | '}';
		readonly members?: V.Unmapped<'typescript:object_type_content'>;
		// unmapped: <typescript:object_type_content>
		readonly opening: '{' | '{|';
	}
	export interface Optional<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly kind: 'type.optional';
		readonly type: G['identifier'] | G['type'];
	}
	export interface Parenthesized<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly kind: 'type.parenthesized';
		readonly type: G['identifier'] | G['type'];
	}
	export interface Path<G extends GrammarContext> extends V.Type<G> {
		// claimed by prt
		readonly kind: 'type.path';
		readonly baseType?: G['type'];
		// p only
		readonly module?: G['identifier'];
		// t only
		readonly name: G['identifier'];
		readonly path?: G['identifier'] | G['type'];
		// r only
	}
	export namespace Path {
		export interface Expression<G extends GrammarContext> extends V.Type.Path<G> {
			// claimed by r
			readonly kind: 'type.path.expression';
			readonly name: G['identifier'];
			readonly path?: G['identifier'] | V.Type.Generic.Turbofish<G>;
		}
		export type Any<G extends GrammarContext> = V.Type.Path<G> | V.Type.Path.Expression<G>;
	}
	export interface Pointer<G extends GrammarContext> extends V.Type<G> {
		// claimed by r
		readonly kind: 'type.pointer';
	}
	export interface Predicate<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly kind: 'type.predicate';
		readonly name?: G['identifier'] | V.Type.Primitive<G>;
		readonly type?: G['identifier'] | G['type'];
	}
	export namespace Predicate {
		export interface Asserts<G extends GrammarContext> extends V.Type.Predicate<G> {
			// claimed by t
			readonly kind: 'type.predicate.asserts';
			readonly content: G['identifier'] | V.Type.Predicate<G>;
		}
		export type Any<G extends GrammarContext> = V.Type.Predicate<G> | V.Type.Predicate.Asserts<G>;
	}
	export interface Primitive<G extends GrammarContext> extends V.Type<G> {
		// claimed by rt
		readonly kind: 'type.primitive';
	}
	export namespace Primitive {
		export interface Never<G extends GrammarContext> extends V.Type.Primitive<G> {
			// claimed by rt
			readonly kind: 'type.primitive.never';
		}
		export type Any<G extends GrammarContext> = V.Type.Primitive<G> | V.Type.Primitive.Never<G>;
	}
	export interface Qualified<G extends GrammarContext> extends V.Type<G> {
		// claimed by r
		readonly kind: 'type.qualified';
		readonly alias: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
		readonly type: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
	}
	export interface Query<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly kind: 'type.query';
		readonly content:
			| V.Unmapped<'typescript:type_query_call_expression'>
			| V.Unmapped<'typescript:type_query_instantiation_expression'>
			| V.Unmapped<'typescript:type_query_member_expression'>
			| V.Unmapped<'typescript:type_query_subscript_expression'>
			| G['identifier'];
		// unmapped: <typescript:type_query_call_expression> <typescript:type_query_instantiation_expression> <typescript:type_query_member_expression> <typescript:type_query_subscript_expression>
	}
	export interface Readonly<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly kind: 'type.readonly';
		readonly type: G['identifier'] | G['type'];
	}
	export interface Reference<G extends GrammarContext> extends V.Type<G> {
		// claimed by r
		readonly kind: 'type.reference';
		readonly lifetime?: V.Identifier.Lifetime<G>;
		readonly mutableSpecifier?: boolean;
		readonly type: V.Clause.Bounds.Removed<G> | V.Expression.Call.Macro<G> | G['identifier'] | G['type'];
	}
	export interface Rest<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly kind: 'type.rest';
		readonly type: G['identifier'] | G['type'];
	}
	export interface Splat<G extends GrammarContext> extends V.Type<G> {
		// claimed by p
		readonly kind: 'type.splat';
		readonly name: G['identifier'];
		readonly operator: '*' | '**';
	}
	export interface Template<G extends GrammarContext> extends V.Type<G> {
		// claimed by t
		readonly kind: 'type.template';
		readonly elements?: (V.Unmapped<'typescript:template_chars'> | V.Element.Template.Substitution<G>)[];
		// unmapped: <typescript:template_chars>
	}
	export interface Tuple<G extends GrammarContext> extends V.Type<G> {
		// claimed by rt
		readonly kind: 'type.tuple';
		readonly tupleTypeElements?: V.Unmapped<'rust:tuple_type_elements'>;
		// r only
		// unmapped: <rust:tuple_type_elements>
		readonly tupleTypeMembers?: V.Unmapped<'typescript:tuple_type_members'>;
		// t only
		// unmapped: <typescript:tuple_type_members>
	}
	export interface Union<G extends GrammarContext> extends V.Type<G> {
		// claimed by pt
		readonly kind: 'type.union';
		readonly left?: G['identifier'] | G['type'];
		readonly right: G['identifier'] | G['type'];
	}
	export interface Unit<G extends GrammarContext> extends V.Type<G> {
		// claimed by r
		readonly kind: 'type.unit';
	}
	export type Any<G extends GrammarContext> =
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
		| V.Type.Named.Prelude<G>
		| V.Type.Object<G>
		| V.Type.Optional<G>
		| V.Type.Parenthesized<G>
		| V.Type.Path<G>
		| V.Type.Path.Expression<G>
		| V.Type.Pointer<G>
		| V.Type.Predicate<G>
		| V.Type.Predicate.Asserts<G>
		| V.Type.Primitive<G>
		| V.Type.Primitive.Never<G>
		| V.Type.Qualified<G>
		| V.Type.Query<G>
		| V.Type.Readonly<G>
		| V.Type.Reference<G>
		| V.Type.Rest<G>
		| V.Type.Splat<G>
		| V.Type.Template<G>
		| V.Type.Tuple<G>
		| V.Type.Union<G>
		| V.Type.Unit<G>;
}
