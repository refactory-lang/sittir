import type { GrammarMap, Slot, Text } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Type {
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
	// claimed by rt
	export type Primitive<G extends GrammarMap> = Text<G, 'type.primitive'>;
	export namespace Primitive {
		// claimed by rt
		export type Boolean<G extends GrammarMap> = Text<G, 'type.primitive.boolean'>;
		export type Floating<G extends GrammarMap> = Text<G, 'type.primitive.floating'>;
		export namespace Floating {
			// claimed by rt
			export type Float64<G extends GrammarMap> = Text<G, 'type.primitive.floating.float64'>;
		}
		// claimed by rt
		export type Never<G extends GrammarMap> = Text<G, 'type.primitive.never'>;
		// claimed by rt
		export type String<G extends GrammarMap> = Text<G, 'type.primitive.string'>;
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
}
