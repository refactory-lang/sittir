import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Collection {
		export interface Struct<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Collection<G>> {
			readonly $kind: 'expression.collection.struct';
			readonly body: V.Element.Struct.Any<G>[];
			readonly name: G['slots']['expression.collection.struct']['name'];
		}
	}
}
