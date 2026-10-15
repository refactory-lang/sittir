import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Collection {
		export interface Tuple<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Collection<G>> {
			// claimed by pr
			readonly $kind: 'expression.collection.tuple';
			readonly elements?: G['slots']['expression.collection.tuple']['elements'][];
		}
		export namespace Tuple {
			export interface Bare<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Collection.Tuple<G>> {
				// claimed by p
				readonly $kind: 'expression.collection.tuple.bare';
			}
		}
	}
	export interface Unit<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by r
		readonly $kind: 'expression.unit';
	}
}
