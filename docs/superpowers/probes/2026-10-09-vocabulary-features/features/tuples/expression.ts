import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Collection {
		export interface Tuple<G extends GrammarContext> extends SubKindOf<V.Expression.Collection<G>> {
			readonly $kind: 'expression.collection.tuple';
			readonly elements?: G['slots']['expression.collection.tuple']['elements'][];
			readonly expressions?: G['slots']['expression.collection.tuple']['expressions'][];
		}
		export namespace Tuple {
			export interface Bare<G extends GrammarContext> extends SubKindOf<V.Expression.Collection.Tuple<G>> {
				readonly $kind: 'expression.collection.tuple.bare';
			}
		}
	}
	export interface Unit<G extends GrammarContext> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.unit';
	}
}
