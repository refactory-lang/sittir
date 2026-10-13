import type { GrammarContext } from '../../context.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Type {
	export interface Abstract<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by r
		readonly $kind: 'type.abstract';
		readonly trait: G['slots']['type.abstract']['trait'];
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
		readonly parameters: G['slots']['type.function']['parameters'][];
		readonly returnType?: G['slots']['type.function']['returnType'];
		readonly trait?: G['slots']['type.function']['trait'];
		// r only
	}
	export namespace Function {
		export interface Constructor<G extends GrammarContext<G>> extends SubKindOf<V.Type.Function<G>> {
			// claimed by t
			readonly $kind: 'type.function.constructor';
			readonly parameters: V.Declaration.Parameter.Any<G>[];
			readonly type: G['slots']['type.function.constructor']['type'];
		}
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
	}
	export interface Pointer<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by r
		readonly $kind: 'type.pointer';
		readonly type: G['slots']['type.pointer']['type'];
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
	}
	export interface Primitive<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by rt
		readonly $kind: 'type.primitive';
	}
	export namespace Primitive {
		export interface Boolean<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive<G>> {
			// claimed by rt
			readonly $kind: 'type.primitive.boolean';
		}
		export interface Floating<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive<G>> {
			readonly $kind: 'type.primitive.floating';
		}
		export namespace Floating {
			export interface Float32<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive.Floating<G>> {
				// claimed by r
				readonly $kind: 'type.primitive.floating.float32';
			}
			export interface Float64<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive.Floating<G>> {
				// claimed by rt
				readonly $kind: 'type.primitive.floating.float64';
			}
		}
		export interface Integral<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive<G>> {
			readonly $kind: 'type.primitive.integral';
			readonly unsigned?: Flag;
		}
		export namespace Integral {
			export interface Int8<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive.Integral<G>> {
				// claimed by r
				readonly $kind: 'type.primitive.integral.int8';
			}
			export interface Int16<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive.Integral<G>> {
				// claimed by r
				readonly $kind: 'type.primitive.integral.int16';
			}
			export interface Int32<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive.Integral<G>> {
				// claimed by r
				readonly $kind: 'type.primitive.integral.int32';
			}
			export interface Int64<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive.Integral<G>> {
				// claimed by r
				readonly $kind: 'type.primitive.integral.int64';
			}
			export interface Int128<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive.Integral<G>> {
				// claimed by r
				readonly $kind: 'type.primitive.integral.int128';
			}
			export interface Size<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive.Integral<G>> {
				// claimed by r
				readonly $kind: 'type.primitive.integral.size';
			}
		}
		export interface Never<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive<G>> {
			// claimed by rt
			readonly $kind: 'type.primitive.never';
		}
		export interface Object<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive<G>> {
			// claimed by t
			readonly $kind: 'type.primitive.object';
		}
		export interface String<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive<G>> {
			// claimed by rt
			readonly $kind: 'type.primitive.string';
		}
		export interface Symbol<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive<G>> {
			// claimed by t
			readonly $kind: 'type.primitive.symbol';
			readonly unique?: Flag;
		}
		export interface Unchecked<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive<G>> {
			// claimed by t
			readonly $kind: 'type.primitive.unchecked';
		}
		export interface Unknown<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive<G>> {
			// claimed by t
			readonly $kind: 'type.primitive.unknown';
		}
		export interface Void<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive<G>> {
			// claimed by t
			readonly $kind: 'type.primitive.void';
		}
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
}
