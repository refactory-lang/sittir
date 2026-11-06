import type { GrammarMap } from '../../../map.ts';
import type { Flag, SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export namespace Collection {
		export namespace Tuple {
			export interface Bare<G extends GrammarMap, K extends Under<'expression.collection.tuple.bare'> = 'expression.collection.tuple.bare'> extends SubKindOf<V.Expression.Collection.Tuple<G, K>> {
				// claimed by p
				readonly $path: K;
				readonly trailingComma?: Flag;
			}
		}
	}
}
