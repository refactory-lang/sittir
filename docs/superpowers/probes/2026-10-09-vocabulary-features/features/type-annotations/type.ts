import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Type {
	export interface Abstract<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.abstract';
		readonly trait: G['slots']['type.abstract']['trait'];
	}
	export interface Array<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.array';
		readonly element?: G['slots']['type.array']['element'];
		readonly length?: G['slots']['type.array']['length'];
		readonly type?: G['slots']['type.array']['type'];
	}
	export interface Bounded<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.bounded';
		readonly left: G['slots']['type.bounded']['left'];
		readonly right: G['slots']['type.bounded']['right'];
	}
	export interface Bracketed<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.bracketed';
		readonly type: G['slots']['type.bracketed']['type'];
	}
	export interface Conditional<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.conditional';
		readonly alternative: G['slots']['type.conditional']['alternative'];
		readonly consequence: G['slots']['type.conditional']['consequence'];
		readonly left: G['slots']['type.conditional']['left'];
		readonly right: G['slots']['type.conditional']['right'];
	}
	export interface Constrained<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.constrained';
		readonly baseType: G['type'];
		readonly constraint: G['type'];
	}
	export interface Dynamic<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.dynamic';
		readonly trait: G['slots']['type.dynamic']['trait'];
	}
	export interface Existential<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.existential';
	}
	export interface Function<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.function';
		readonly content?: G['slots']['type.function']['content'] | G['slots']['type.function']['content'][];
		readonly forLifetimes?: V.Clause.Lifetimes<G>;
		readonly parameters: G['slots']['type.function']['parameters'][];
		readonly returnType?: G['slots']['type.function']['returnType'];
	}
	export namespace Function {
		export interface Constructor<G extends GrammarContext> extends SubKindOf<V.Type.Function<G>> {
			readonly $kind: 'type.function.constructor';
			readonly abstract?: boolean;
			readonly parameters: V.Declaration.Parameter.Any<G>[];
			readonly type: G['slots']['type.function.constructor']['type'];
		}
	}
	export interface Generic<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.generic';
		readonly name?: G['slots']['type.generic']['name'];
		readonly type?: G['slots']['type.generic']['type'];
		readonly typeArguments?: G['slots']['type.generic']['typeArguments'][];
		readonly typeParameter?: V.Declaration.TypeParameter<G>;
	}
	export namespace Generic {
		export interface Turbofish<G extends GrammarContext> extends SubKindOf<V.Type.Generic<G>> {
			readonly $kind: 'type.generic.turbofish';
			readonly type: G['identifier'];
			readonly typeArguments: V.Element.TypeArgument<G>[];
		}
	}
	export interface IndexQuery<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.index_query';
		readonly type: G['slots']['type.index_query']['type'];
	}
	export interface Infer<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.infer';
		readonly name: V.Identifier.Type<G>;
		readonly type?: G['slots']['type.infer']['type'];
	}
	export interface Intersection<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.intersection';
		readonly left?: G['slots']['type.intersection']['left'];
		readonly right: G['slots']['type.intersection']['right'];
	}
	export interface Literal<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.literal';
		readonly content: G['slots']['type.literal']['content'];
	}
	export interface Lookup<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.lookup';
		readonly indexType: G['slots']['type.lookup']['indexType'];
		readonly type: G['slots']['type.lookup']['type'];
	}
	export interface Maybe<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.maybe';
		readonly type: G['slots']['type.maybe']['type'];
	}
	export interface Named<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.named';
	}
	export namespace Named {
		export interface Prelude<G extends GrammarContext> extends SubKindOf<V.Type.Named<G>> {
			readonly $kind: 'type.named.prelude';
		}
	}
	export interface Object<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.object';
		readonly closing: G['slots']['type.object']['closing'];
		readonly members?: G['slots']['type.object']['members'][];
		readonly opening: G['slots']['type.object']['opening'];
	}
	export interface Optional<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.optional';
		readonly type: G['slots']['type.optional']['type'];
	}
	export interface Parenthesized<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.parenthesized';
		readonly type: G['slots']['type.parenthesized']['type'];
	}
	export interface Path<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.path';
		readonly baseType?: G['type'];
		readonly module?: G['identifier'];
		readonly name: G['identifier'];
		readonly path?: G['slots']['type.path']['path'];
	}
	export namespace Path {
		export interface Expression<G extends GrammarContext> extends SubKindOf<V.Type.Path<G>> {
			readonly $kind: 'type.path.expression';
			readonly name: V.Identifier.Type<G>;
			readonly path?: G['slots']['type.path.expression']['path'];
		}
	}
	export interface Pointer<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.pointer';
	}
	export interface Predicate<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.predicate';
		readonly name?: G['slots']['type.predicate']['name'];
		readonly type?: G['slots']['type.predicate']['type'];
	}
	export namespace Predicate {
		export interface Asserts<G extends GrammarContext> extends SubKindOf<V.Type.Predicate<G>> {
			readonly $kind: 'type.predicate.asserts';
			readonly value: G['slots']['type.predicate.asserts']['value'];
		}
	}
	export interface Primitive<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.primitive';
	}
	export namespace Primitive {
		export interface Never<G extends GrammarContext> extends SubKindOf<V.Type.Primitive<G>> {
			readonly $kind: 'type.primitive.never';
		}
	}
	export interface Qualified<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.qualified';
		readonly alias: G['slots']['type.qualified']['alias'];
		readonly type: G['slots']['type.qualified']['type'];
	}
	export interface Query<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.query';
		readonly expression: G['slots']['type.query']['expression'];
	}
	export interface Readonly<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.readonly';
		readonly type: G['slots']['type.readonly']['type'];
	}
	export interface Reference<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.reference';
		readonly lifetime?: V.Identifier.Lifetime<G>;
		readonly mutable?: boolean;
		readonly type: G['slots']['type.reference']['type'];
	}
	export interface Rest<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.rest';
		readonly type: G['slots']['type.rest']['type'];
	}
	export interface Splat<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.splat';
		readonly name: G['identifier'];
		readonly operator: G['slots']['type.splat']['operator'];
	}
	export interface Template<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.template';
		readonly elements?: G['slots']['type.template']['elements'][];
	}
	export interface Tuple<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.tuple';
		readonly tupleTypeMembers?: G['slots']['type.tuple']['tupleTypeMembers'][];
		readonly types?: G['slots']['type.tuple']['types'][];
	}
	export interface Union<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.union';
		readonly left?: G['slots']['type.union']['left'];
		readonly right: G['slots']['type.union']['right'];
	}
	export interface Unit<G extends GrammarContext> extends SubKindOf<V.Type<G>> {
		readonly $kind: 'type.unit';
	}
}
