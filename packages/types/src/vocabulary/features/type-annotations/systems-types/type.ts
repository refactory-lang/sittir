import type { GrammarMap, Slot, Text } from '../../../map.ts';
import type { Flagged, SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
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
	export namespace Generic {
		export interface Turbofish<G extends GrammarMap, K extends Under<'type.generic.turbofish'> = 'type.generic.turbofish'> extends SubKindOf<V.Type.Generic<G, K>> {
			// claimed by r
			readonly $path: K;
			readonly type: Slot<G, K, 'type', V.Identifier.Any<G>>;
			readonly typeArguments: Slot<G, K, 'typeArguments', V.Element.TypeArgument<G>>[];
		}
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
	export namespace Primitive {
		export namespace Floating {
			// claimed by r
			export type Float32<G extends GrammarMap> = Text<G, 'type.primitive.floating.float32'>;
		}
		export type Integral<G extends GrammarMap> = Flagged<Text<G, 'type.primitive.integral'>, 'unsigned'>;
		export namespace Integral {
			// claimed by r
			export type Int128<G extends GrammarMap> = Text<G, 'type.primitive.integral.int128'>;
			// claimed by r
			export type Int16<G extends GrammarMap> = Text<G, 'type.primitive.integral.int16'>;
			// claimed by r
			export type Int32<G extends GrammarMap> = Text<G, 'type.primitive.integral.int32'>;
			// claimed by r
			export type Int64<G extends GrammarMap> = Text<G, 'type.primitive.integral.int64'>;
			// claimed by r
			export type Int8<G extends GrammarMap> = Text<G, 'type.primitive.integral.int8'>;
			// claimed by r
			export type Size<G extends GrammarMap> = Text<G, 'type.primitive.integral.size'>;
		}
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
	// claimed by r
	export type Unit<G extends GrammarMap> = Text<G, 'type.unit'>;
}
