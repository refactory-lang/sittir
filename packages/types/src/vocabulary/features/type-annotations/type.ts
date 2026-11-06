import type { GrammarMap, Slot, Text } from '../../map.ts';
import type { Flagged, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Type {
	export interface Abstract<G extends GrammarMap, K extends Under<'type.abstract'> = 'type.abstract'> extends SubKindOf<V.Type<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly trait: Slot<
			G,
			K,
			'trait',
			| V.Clause.Bounds.Removed<G>
			| V.Identifier<G>
			| V.Type.Any<G>
			| V.Identifier.Any<G>
		>;
	}
	export interface Array<G extends GrammarMap, K extends Under<'type.array'> = 'type.array'> extends SubKindOf<V.Type<G, K>> {
		// claimed by rt
		readonly $path: K;
		readonly element?: Slot<
			G,
			K,
			'element',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
		// r only
		readonly length?: Slot<
			G,
			K,
			'length',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
		>;
		// r only
		readonly type?: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		// t only
	}
	export interface Bounded<G extends GrammarMap, K extends Under<'type.bounded'> = 'type.bounded'> extends SubKindOf<V.Type<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly left: Slot<
			G,
			K,
			'left',
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Clause.Bounds.Removed<G>
			| V.Clause.Bounds.Use<G>
			| V.Type.Any<G>
		>;
		readonly right: Slot<
			G,
			K,
			'right',
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Clause.Bounds.Removed<G>
			| V.Clause.Bounds.Use<G>
			| V.Type.Any<G>
		>;
	}
	export interface Bracketed<G extends GrammarMap, K extends Under<'type.bracketed'> = 'type.bracketed'> extends SubKindOf<V.Type<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly type: Slot<
			G,
			K,
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export interface Conditional<G extends GrammarMap, K extends Under<'type.conditional'> = 'type.conditional'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly alternative: Slot<G, K, 'alternative', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly consequence: Slot<G, K, 'consequence', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly left: Slot<G, K, 'left', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly right: Slot<G, K, 'right', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Constrained<G extends GrammarMap, K extends Under<'type.constrained'> = 'type.constrained'> extends SubKindOf<V.Type<G, K>> {
		// claimed by p
		readonly $path: K;
		readonly baseType: Slot<G, K, 'baseType', V.Type.Any<G>>;
	}
	export interface Dynamic<G extends GrammarMap, K extends Under<'type.dynamic'> = 'type.dynamic'> extends SubKindOf<V.Type<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly trait: Slot<
			G,
			K,
			'trait',
			| V.Clause.Bounds.HigherRanked<G>
			| V.Identifier<G>
			| V.Type.Any<G>
			| V.Identifier.Any<G>
		>;
	}
	// claimed by t
	export type Existential<G extends GrammarMap> = Text<G, 'type.existential'>;
	export interface Function<G extends GrammarMap, K extends Under<'type.function'> = 'type.function'> extends SubKindOf<V.Type<G, K>> {
		// claimed by rt
		readonly $path: K;
		readonly extern?: Slot<G, K, 'extern', V.Modifier.Extern<G>>;
		// r only
		readonly parameters: Slot<
			G,
			K,
			'parameters',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Declaration.Parameter<G>
			| V.Declaration.Parameter.Private<G>
			| V.Declaration.Parameter.Protected<G>
			| V.Declaration.Parameter.Public<G>
			| V.Declaration.Parameter.Receiver<G>
			| V.Declaration.Parameter.Variadic<G>
			| string
			| V.Type.Any<G>
		>[];
		readonly returnType?: Slot<
			G,
			K,
			'returnType',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
		readonly trait?: Slot<G, K, 'trait', V.Identifier<G> | V.Identifier.Qualified<G> | V.Identifier.Any<G>>;
		// r only
	}
	export namespace Function {
		export interface Constructor<G extends GrammarMap, K extends Under<'type.function.constructor'> = 'type.function.constructor'> extends SubKindOf<V.Type.Function<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly parameters: Slot<
				G,
				K,
				'parameters',
				| V.Declaration.Parameter<G>
				| V.Declaration.Parameter.Private<G>
				| V.Declaration.Parameter.Protected<G>
				| V.Declaration.Parameter.Public<G>
				| V.Declaration.Parameter.Receiver<G>
			>[];
			readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
	}
	export interface Generic<G extends GrammarMap, K extends Under<'type.generic'> = 'type.generic'> extends SubKindOf<V.Type<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly name?: Slot<G, K, 'name', V.Identifier.Any<G> | string | V.Identifier.Qualified<G>>;
		// pt only
		readonly type?: Slot<G, K, 'type', V.Identifier.Any<G> | string | V.Identifier.Qualified<G>>;
		// r only
		readonly typeArguments?: Slot<
			G,
			K,
			'typeArguments',
			| V.Element.TypeArgument<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>[];
	}
	export namespace Generic {
		export interface Turbofish<G extends GrammarMap, K extends Under<'type.generic.turbofish'> = 'type.generic.turbofish'> extends SubKindOf<V.Type.Generic<G, K>> {
			// claimed by r
			readonly $path: K;
			readonly type: Slot<G, K, 'type', V.Identifier.Any<G>>;
			readonly typeArguments: Slot<G, K, 'typeArguments', V.Element.TypeArgument<G>>[];
		}
	}
	export interface IndexQuery<G extends GrammarMap, K extends Under<'type.index_query'> = 'type.index_query'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Infer<G extends GrammarMap, K extends Under<'type.infer'> = 'type.infer'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		readonly type?: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Intersection<G extends GrammarMap, K extends Under<'type.intersection'> = 'type.intersection'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly left?: Slot<G, K, 'left', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly right: Slot<G, K, 'right', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Literal<G extends GrammarMap, K extends Under<'type.literal'> = 'type.literal'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly content: Slot<G, K, 'content', unknown>;
	}
	export interface Lookup<G extends GrammarMap, K extends Under<'type.lookup'> = 'type.lookup'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly indexType: Slot<G, K, 'indexType', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Object<G extends GrammarMap, K extends Under<'type.object'> = 'type.object'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly closing: Slot<G, K, 'closing', string>;
		readonly members?: Slot<G, K, 'members', V.Declaration.Any<G> | V.Statement.Export.Any<G>>[];
		readonly opening: Slot<G, K, 'opening', string>;
	}
	export interface Optional<G extends GrammarMap, K extends Under<'type.optional'> = 'type.optional'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Parenthesized<G extends GrammarMap, K extends Under<'type.parenthesized'> = 'type.parenthesized'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Pointer<G extends GrammarMap, K extends Under<'type.pointer'> = 'type.pointer'> extends SubKindOf<V.Type<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly type: Slot<
			G,
			K,
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export interface Predicate<G extends GrammarMap, K extends Under<'type.predicate'> = 'type.predicate'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly name?: Slot<G, K, 'name', V.Identifier.Any<G> | V.Type.Primitive<G>>;
		readonly type?: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export namespace Predicate {
		export interface Asserts<G extends GrammarMap, K extends Under<'type.predicate.asserts'> = 'type.predicate.asserts'> extends SubKindOf<V.Type.Predicate<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly value: Slot<G, K, 'value', V.Identifier.Any<G> | V.Type.Predicate<G>>;
		}
	}
	// claimed by rt
	export type Primitive<G extends GrammarMap> = Text<G, 'type.primitive'>;
	export namespace Primitive {
		// claimed by rt
		export type Boolean<G extends GrammarMap> = Text<G, 'type.primitive.boolean'>;
		export type Floating<G extends GrammarMap> = Text<G, 'type.primitive.floating'>;
		export namespace Floating {
			// claimed by r
			export type Float32<G extends GrammarMap> = Text<G, 'type.primitive.floating.float32'>;
			// claimed by rt
			export type Float64<G extends GrammarMap> = Text<G, 'type.primitive.floating.float64'>;
		}
		export type Integral<G extends GrammarMap> = Flagged<Text<G, 'type.primitive.integral'>, 'unsigned'>;
		export namespace Integral {
			// claimed by r
			export type Int8<G extends GrammarMap> = Text<G, 'type.primitive.integral.int8'>;
			// claimed by r
			export type Int16<G extends GrammarMap> = Text<G, 'type.primitive.integral.int16'>;
			// claimed by r
			export type Int32<G extends GrammarMap> = Text<G, 'type.primitive.integral.int32'>;
			// claimed by r
			export type Int64<G extends GrammarMap> = Text<G, 'type.primitive.integral.int64'>;
			// claimed by r
			export type Int128<G extends GrammarMap> = Text<G, 'type.primitive.integral.int128'>;
			// claimed by r
			export type Size<G extends GrammarMap> = Text<G, 'type.primitive.integral.size'>;
		}
		// claimed by rt
		export type Never<G extends GrammarMap> = Text<G, 'type.primitive.never'>;
		// claimed by t
		export type Object<G extends GrammarMap> = Text<G, 'type.primitive.object'>;
		// claimed by rt
		export type String<G extends GrammarMap> = Text<G, 'type.primitive.string'>;
		// claimed by t
		export type Symbol<G extends GrammarMap> = Flagged<Text<G, 'type.primitive.symbol'>, 'unique'>;
		// claimed by t
		export type Unchecked<G extends GrammarMap> = Text<G, 'type.primitive.unchecked'>;
		// claimed by t
		export type Unknown<G extends GrammarMap> = Text<G, 'type.primitive.unknown'>;
		// claimed by t
		export type Void<G extends GrammarMap> = Text<G, 'type.primitive.void'>;
	}
	export interface Qualified<G extends GrammarMap, K extends Under<'type.qualified'> = 'type.qualified'> extends SubKindOf<V.Type<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly alias: Slot<
			G,
			K,
			'alias',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
		readonly type: Slot<
			G,
			K,
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export interface Query<G extends GrammarMap, K extends Under<'type.query'> = 'type.query'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly expression: Slot<G, K, 'expression', unknown>;
	}
	export interface Readonly<G extends GrammarMap, K extends Under<'type.readonly'> = 'type.readonly'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Reference<G extends GrammarMap, K extends Under<'type.reference'> = 'type.reference'> extends SubKindOf<V.Type<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly type: Slot<
			G,
			K,
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export interface Rest<G extends GrammarMap, K extends Under<'type.rest'> = 'type.rest'> extends SubKindOf<V.Type<G, K>> {
		// claimed by pt
		readonly $path: K;
		readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Template<G extends GrammarMap, K extends Under<'type.template'> = 'type.template'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly elements?: Slot<G, K, 'elements', unknown>[];
	}
	export interface Tuple<G extends GrammarMap, K extends Under<'type.tuple'> = 'type.tuple'> extends SubKindOf<V.Type<G, K>> {
		// claimed by rt
		readonly $path: K;
		readonly tupleTypeMembers?: Slot<
			G,
			K,
			'tupleTypeMembers',
			| V.Identifier.Any<G>
			| V.Element.Tuple.Member.Any<G>
			| V.Type.Any<G>
		>[];
		// t only
		readonly types?: Slot<
			G,
			K,
			'types',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>[];
		// r only
	}
	export interface Union<G extends GrammarMap, K extends Under<'type.union'> = 'type.union'> extends SubKindOf<V.Type<G, K>> {
		// claimed by pt
		readonly $path: K;
		readonly left?: Slot<G, K, 'left', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly right: Slot<G, K, 'right', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	// claimed by r
	export type Unit<G extends GrammarMap> = Text<G, 'type.unit'>;
}
