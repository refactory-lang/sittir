import type { GrammarContext } from './context.ts';
import type { Flag, SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Type<G extends GrammarContext<G>> {
	// claimed by p
	readonly $kind: 'type';
	readonly content?: G['slots']['type']['content'] | G['slots']['type']['content'][];
	// prt only
}

export namespace Type {
	export interface Abstract<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by r
		readonly $kind: 'type.abstract';
		readonly trait: G['slots']['type.abstract']['trait'];
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
	}
	export interface Array<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by rt
		readonly $kind: 'type.array';
		readonly element?: G['slots']['type.array']['element'];
		// r only
		readonly length?: G['slots']['type.array']['length'];
		// r only
		readonly type?: G['slots']['type.array']['type'];
		// t only
	}
	export interface Bounded<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by r
		readonly $kind: 'type.bounded';
		readonly left: G['slots']['type.bounded']['left'];
		readonly right: G['slots']['type.bounded']['right'];
	}
	export interface Bracketed<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by r
		readonly $kind: 'type.bracketed';
		readonly type: G['slots']['type.bracketed']['type'];
	}
	export interface Conditional<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.conditional';
		readonly alternative: G['slots']['type.conditional']['alternative'];
		readonly consequence: G['slots']['type.conditional']['consequence'];
		readonly left: G['slots']['type.conditional']['left'];
		readonly right: G['slots']['type.conditional']['right'];
	}
	export interface Constrained<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by p
		readonly $kind: 'type.constrained';
		readonly baseType: G['type'];
		readonly constraint: G['type'];
	}
	export interface Dynamic<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by r
		readonly $kind: 'type.dynamic';
		readonly trait: G['slots']['type.dynamic']['trait'];
	}
	export interface Existential<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.existential';
	}
	export interface Function<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by rt
		readonly $kind: 'type.function';
		readonly extern?: V.Modifier.Extern<G>;
		// r only
		readonly forLifetimes?: V.Clause.Lifetimes<G>;
		// r only
		readonly parameters: G['slots']['type.function']['parameters'][];
		readonly returnType?: G['slots']['type.function']['returnType'];
		readonly trait?: G['slots']['type.function']['trait'];
		// r only
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		// t only
		readonly unsafe?: Flag;
		// r only
	}
	export namespace Function {
		export interface Constructor<G extends GrammarContext<G>> extends SubKindOf<V.Type.Function<G>> {
			// claimed by t
			readonly $kind: 'type.function.constructor';
			readonly abstract?: Flag;
			readonly parameters: V.Declaration.Parameter.Any<G>[];
			readonly type: G['slots']['type.function.constructor']['type'];
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export type Any<G extends GrammarContext<G>> = V.Type.Function<G> | V.Type.Function.Constructor<G>;
	}
	export interface Generic<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by prt
		readonly $kind: 'type.generic';
		readonly name?: G['slots']['type.generic']['name'];
		// pt only
		readonly type?: G['slots']['type.generic']['type'];
		// r only
		readonly typeArguments?: G['slots']['type.generic']['typeArguments'][];
		// rt only
		readonly typeParameter?: V.Declaration.TypeParameter<G>;
		// p only
	}
	export namespace Generic {
		export interface Turbofish<G extends GrammarContext<G>> extends SubKindOf<V.Type.Generic<G>> {
			// claimed by r
			readonly $kind: 'type.generic.turbofish';
			readonly type: G['identifier'];
			readonly typeArguments: V.Element.TypeArgument<G>[];
		}
		export type Any<G extends GrammarContext<G>> = V.Type.Generic<G> | V.Type.Generic.Turbofish<G>;
	}
	export interface IndexQuery<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.index_query';
		readonly type: G['slots']['type.index_query']['type'];
	}
	export interface Infer<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.infer';
		readonly name: V.Identifier.Type<G>;
		readonly type?: G['slots']['type.infer']['type'];
	}
	export interface Intersection<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.intersection';
		readonly left?: G['slots']['type.intersection']['left'];
		readonly right: G['slots']['type.intersection']['right'];
	}
	export interface Literal<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.literal';
		readonly content: G['slots']['type.literal']['content'];
	}
	export interface Lookup<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.lookup';
		readonly indexType: G['slots']['type.lookup']['indexType'];
		readonly type: G['slots']['type.lookup']['type'];
	}
	export interface Maybe<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.maybe';
		readonly type: G['slots']['type.maybe']['type'];
	}
	export interface Named<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.named';
	}
	export namespace Named {
		export interface Prelude<G extends GrammarContext<G>> extends SubKindOf<V.Type.Named<G>> {
			// claimed by r
			readonly $kind: 'type.named.prelude';
		}
		export type Any<G extends GrammarContext<G>> = V.Type.Named.Prelude<G>;
	}
	export interface Object<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.object';
		readonly closing: G['slots']['type.object']['closing'];
		readonly members?: G['slots']['type.object']['members'][];
		readonly opening: G['slots']['type.object']['opening'];
	}
	export interface Optional<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.optional';
		readonly type: G['slots']['type.optional']['type'];
	}
	export interface Parenthesized<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.parenthesized';
		readonly type: G['slots']['type.parenthesized']['type'];
	}
	export interface Path<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by prt
		readonly $kind: 'type.path';
		readonly baseType?: G['type'];
		// p only
		readonly module?: G['identifier'];
		// t only
		readonly name: G['identifier'];
		readonly path?: G['slots']['type.path']['path'];
		// r only
	}
	export namespace Path {
		export interface Expression<G extends GrammarContext<G>> extends SubKindOf<V.Type.Path<G>> {
			// claimed by r
			readonly $kind: 'type.path.expression';
			readonly name: V.Identifier.Type<G>;
			readonly path?: G['slots']['type.path.expression']['path'];
		}
		export type Any<G extends GrammarContext<G>> = V.Type.Path<G> | V.Type.Path.Expression<G>;
	}
	export interface Pointer<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by r
		readonly $kind: 'type.pointer';
		readonly type: G['slots']['type.pointer']['type'];
		readonly writable?: Flag;
	}
	export interface Predicate<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.predicate';
		readonly name?: G['slots']['type.predicate']['name'];
		readonly type?: G['slots']['type.predicate']['type'];
	}
	export namespace Predicate {
		export interface Asserts<G extends GrammarContext<G>> extends SubKindOf<V.Type.Predicate<G>> {
			// claimed by t
			readonly $kind: 'type.predicate.asserts';
			readonly value: G['slots']['type.predicate.asserts']['value'];
		}
		export type Any<G extends GrammarContext<G>> = V.Type.Predicate<G> | V.Type.Predicate.Asserts<G>;
	}
	export interface Primitive<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by rt
		readonly $kind: 'type.primitive';
	}
	export namespace Primitive {
		export interface Never<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive<G>> {
			// claimed by rt
			readonly $kind: 'type.primitive.never';
		}
		export type Any<G extends GrammarContext<G>> = V.Type.Primitive<G> | V.Type.Primitive.Never<G>;
	}
	export interface Qualified<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by r
		readonly $kind: 'type.qualified';
		readonly alias: G['slots']['type.qualified']['alias'];
		readonly type: G['slots']['type.qualified']['type'];
	}
	export interface Query<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.query';
		readonly expression: G['slots']['type.query']['expression'];
	}
	export interface Readonly<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.readonly';
		readonly type: G['slots']['type.readonly']['type'];
	}
	export interface Reference<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by r
		readonly $kind: 'type.reference';
		readonly exclusive?: Flag;
		readonly lifetime?: V.Identifier.Lifetime<G>;
		readonly type: G['slots']['type.reference']['type'];
	}
	export interface Rest<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.rest';
		readonly type: G['slots']['type.rest']['type'];
	}
	export interface Splat<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by p
		readonly $kind: 'type.splat';
		readonly name: G['identifier'];
		readonly operator: G['slots']['type.splat']['operator'];
	}
	export interface Template<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.template';
		readonly elements?: G['slots']['type.template']['elements'][];
	}
	export interface Tuple<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by rt
		readonly $kind: 'type.tuple';
		readonly tupleTypeMembers?: G['slots']['type.tuple']['tupleTypeMembers'][];
		// t only
		readonly types?: G['slots']['type.tuple']['types'][];
		// r only
	}
	export interface Union<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by pt
		readonly $kind: 'type.union';
		readonly left?: G['slots']['type.union']['left'];
		readonly right: G['slots']['type.union']['right'];
	}
	export interface Unit<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by r
		readonly $kind: 'type.unit';
	}
	export type Any<G extends GrammarContext<G>> =
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
