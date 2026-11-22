import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export type Block<G extends GrammarMap> = V.Statement.Block.Any<G>;
	export type Break<G extends GrammarMap> = V.Statement.Break<G>;
	export type Continue<G extends GrammarMap> = V.Statement.Continue<G>;
	export type If<G extends GrammarMap> = V.Statement.If<G>;
	export type Loop<G extends GrammarMap> = V.Statement.Loop.Any<G>;
	export type Match<G extends GrammarMap> = V.Statement.Match<G>;
	export type Return<G extends GrammarMap> = V.Statement.Return<G>;
	export namespace Call {
		export interface Qualified<G extends GrammarMap, K extends Under<'expression.call.qualified'> = 'expression.call.qualified'> extends SubKindOf<V.Expression.Call<G, K>, 'arguments' | 'function'> {
			// claimed by r
			readonly $path: K;
			readonly arguments: Slot<G, K, 'arguments', V.Expression.AnyWithArgument<G>>[];
			readonly function: Slot<G, K, 'function', V.Expression.Any<G> | string>;
		}
	}
	export namespace Collection {
		export namespace List {
			export interface Repeat<G extends GrammarMap, K extends Under<'expression.collection.list.repeat'> = 'expression.collection.list.repeat'> extends SubKindOf<V.Expression.Collection.List<G, K>> {
				// claimed by r
				readonly $path: K;
				readonly element: Slot<G, K, 'element', V.Expression.Any<G>>;
				readonly length: Slot<G, K, 'length', V.Expression.Any<G>>;
			}
		}
	}
}
