import type { GrammarMap, Slot, Text } from '../../map.ts';
import type { Flagged, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Type {
	export interface Abstract<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by r
		readonly $kind: 'type.abstract';
		readonly trait: Slot<
			G,
			'type.abstract',
			'trait',
			| V.Clause.Bounds.Removed<G>
			| V.Identifier<G>
			| V.Type.Any<G>
			| V.Identifier.Any<G>
		>;
	}
	export interface Array<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by rt
		readonly $kind: 'type.array';
		readonly element?: Slot<
			G,
			'type.array',
			'element',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
		// r only
		readonly length?: Slot<
			G,
			'type.array',
			'length',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
		>;
		// r only
		readonly type?: Slot<G, 'type.array', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		// t only
	}
	export interface Bounded<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by r
		readonly $kind: 'type.bounded';
		readonly left: Slot<
			G,
			'type.bounded',
			'left',
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Clause.Bounds.Removed<G>
			| V.Clause.Bounds.Use<G>
			| V.Type.Any<G>
		>;
		readonly right: Slot<
			G,
			'type.bounded',
			'right',
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Clause.Bounds.Removed<G>
			| V.Clause.Bounds.Use<G>
			| V.Type.Any<G>
		>;
	}
	export interface Bracketed<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by r
		readonly $kind: 'type.bracketed';
		readonly type: Slot<
			G,
			'type.bracketed',
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export interface Conditional<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.conditional';
		readonly alternative: Slot<G, 'type.conditional', 'alternative', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly consequence: Slot<G, 'type.conditional', 'consequence', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly left: Slot<G, 'type.conditional', 'left', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly right: Slot<G, 'type.conditional', 'right', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Constrained<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by p
		readonly $kind: 'type.constrained';
		readonly baseType: Slot<G, 'type.constrained', 'baseType', V.Type.Any<G>>;
	}
	export interface Dynamic<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by r
		readonly $kind: 'type.dynamic';
		readonly trait: Slot<
			G,
			'type.dynamic',
			'trait',
			| V.Clause.Bounds.HigherRanked<G>
			| V.Identifier<G>
			| V.Type.Any<G>
			| V.Identifier.Any<G>
		>;
	}
	// claimed by t
	export type Existential<G extends GrammarMap> = Text<G, 'type.existential'>;
	export interface Function<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by rt
		readonly $kind: 'type.function';
		readonly extern?: V.Modifier.Extern<G>;
		// r only
		readonly parameters: Slot<
			G,
			'type.function',
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
			'type.function',
			'returnType',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
		readonly trait?: Slot<G, 'type.function', 'trait', V.Identifier<G> | V.Identifier.Qualified<G> | V.Identifier.Any<G>>;
		// r only
	}
	export namespace Function {
		export interface Constructor<G extends GrammarMap> extends SubKindOf<V.Type.Function<G>, 'parameters'> {
			// claimed by t
			readonly $kind: 'type.function.constructor';
			readonly parameters: (
				| V.Declaration.Parameter<G>
				| V.Declaration.Parameter.Private<G>
				| V.Declaration.Parameter.Protected<G>
				| V.Declaration.Parameter.Public<G>
				| V.Declaration.Parameter.Receiver<G>
			)[];
			readonly type: Slot<G, 'type.function.constructor', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
	}
	export interface Generic<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by prt
		readonly $kind: 'type.generic';
		readonly name?: Slot<G, 'type.generic', 'name', V.Identifier.Any<G> | string | V.Identifier.Qualified<G>>;
		// pt only
		readonly type?: Slot<G, 'type.generic', 'type', V.Identifier.Any<G> | string | V.Identifier.Qualified<G>>;
		// r only
		readonly typeArguments?: Slot<
			G,
			'type.generic',
			'typeArguments',
			| V.Element.TypeArgument<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>[];
	}
	export namespace Generic {
		export interface Turbofish<G extends GrammarMap> extends SubKindOf<V.Type.Generic<G>, 'type' | 'typeArguments'> {
			// claimed by r
			readonly $kind: 'type.generic.turbofish';
			readonly type: Slot<G, 'type.generic.turbofish', 'type', V.Identifier.Any<G>>;
			readonly typeArguments: V.Element.TypeArgument<G>[];
		}
	}
	export interface IndexQuery<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.index_query';
		readonly type: Slot<G, 'type.index_query', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Infer<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.infer';
		readonly name: V.Identifier<G>;
		readonly type?: Slot<G, 'type.infer', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Intersection<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.intersection';
		readonly left?: Slot<G, 'type.intersection', 'left', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly right: Slot<G, 'type.intersection', 'right', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Literal<G extends GrammarMap> extends SubKindOf<V.Type<G>, 'content'> {
		// claimed by t
		readonly $kind: 'type.literal';
		readonly content: Slot<G, 'type.literal', 'content', unknown>;
	}
	export interface Lookup<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.lookup';
		readonly indexType: Slot<G, 'type.lookup', 'indexType', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly type: Slot<G, 'type.lookup', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Object<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.object';
		readonly closing: Slot<G, 'type.object', 'closing', string>;
		readonly members?: Slot<G, 'type.object', 'members', V.Declaration.Any<G> | V.Statement.Export.Any<G>>[];
		readonly opening: Slot<G, 'type.object', 'opening', string>;
	}
	export interface Optional<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.optional';
		readonly type: Slot<G, 'type.optional', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Parenthesized<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.parenthesized';
		readonly type: Slot<G, 'type.parenthesized', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Pointer<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by r
		readonly $kind: 'type.pointer';
		readonly type: Slot<
			G,
			'type.pointer',
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export interface Predicate<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.predicate';
		readonly name?: Slot<G, 'type.predicate', 'name', V.Identifier.Any<G> | V.Type.Primitive<G>>;
		readonly type?: Slot<G, 'type.predicate', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export namespace Predicate {
		export interface Asserts<G extends GrammarMap> extends SubKindOf<V.Type.Predicate<G>> {
			// claimed by t
			readonly $kind: 'type.predicate.asserts';
			readonly value: Slot<G, 'type.predicate.asserts', 'value', V.Identifier.Any<G> | V.Type.Predicate<G>>;
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
	export interface Qualified<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by r
		readonly $kind: 'type.qualified';
		readonly alias: Slot<
			G,
			'type.qualified',
			'alias',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
		readonly type: Slot<
			G,
			'type.qualified',
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export interface Query<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.query';
		readonly expression: Slot<G, 'type.query', 'expression', unknown>;
	}
	export interface Readonly<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.readonly';
		readonly type: Slot<G, 'type.readonly', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Reference<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by r
		readonly $kind: 'type.reference';
		readonly type: Slot<
			G,
			'type.reference',
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export interface Rest<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by pt
		readonly $kind: 'type.rest';
		readonly type: Slot<G, 'type.rest', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Template<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.template';
		readonly elements?: Slot<G, 'type.template', 'elements', unknown>[];
	}
	export interface Tuple<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by rt
		readonly $kind: 'type.tuple';
		readonly tupleTypeMembers?: Slot<
			G,
			'type.tuple',
			'tupleTypeMembers',
			| V.Identifier.Any<G>
			| V.Element.Tuple.Member.Any<G>
			| V.Type.Any<G>
		>[];
		// t only
		readonly types?: Slot<
			G,
			'type.tuple',
			'types',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>[];
		// r only
	}
	export interface Union<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by pt
		readonly $kind: 'type.union';
		readonly left?: Slot<G, 'type.union', 'left', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly right: Slot<G, 'type.union', 'right', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	// claimed by r
	export type Unit<G extends GrammarMap> = Text<G, 'type.unit'>;
}
