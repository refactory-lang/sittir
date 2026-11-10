import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Block<G extends GrammarMap, K extends Under<'expression.block'> = 'expression.block'> extends SubKindOf<V.Expression<G, K>> {
		readonly $path: K;
		readonly body: Slot<G, K, 'body', V.Statement.Block<G>>;
		// r only
	}
	export namespace Call {
		export interface Qualified<G extends GrammarMap, K extends Under<'expression.call.qualified'> = 'expression.call.qualified'> extends SubKindOf<V.Expression.Call<G, K>> {
			// claimed by r
			readonly $path: K;
			readonly arguments: Slot<
				G,
				K,
				'arguments',
				| V.Argument.Any<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
			>[];
			readonly function: Slot<
				G,
				K,
				'function',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
				| string
			>;
		}
	}
	export namespace Collection {
		export namespace List {
			export interface Repeat<G extends GrammarMap, K extends Under<'expression.collection.list.repeat'> = 'expression.collection.list.repeat'> extends SubKindOf<V.Expression.Collection.List<G, K>> {
				// claimed by r
				readonly $path: K;
				readonly element: Slot<
					G,
					K,
					'element',
					| V.Expression.Any<G>
					| V.Identifier.Any<G>
					| V.Literal.Any<G>
					| V.Statement.Any<G>
					| V.Type.Primitive<G>
				>;
				readonly length: Slot<
					G,
					K,
					'length',
					| V.Expression.Any<G>
					| V.Identifier.Any<G>
					| V.Literal.Any<G>
					| V.Statement.Any<G>
					| V.Type.Primitive<G>
				>;
			}
		}
	}
}
