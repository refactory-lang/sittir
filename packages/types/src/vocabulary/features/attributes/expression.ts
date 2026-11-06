import type { GrammarMap, Slot } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Collection {
		export interface List<G extends GrammarMap> {
			readonly attributes?: Slot<G, 'expression.collection.list', 'attributes', V.Attribute.Any<G>>[];
			// r only
		}
		export interface Tuple<G extends GrammarMap> {
			readonly attributes?: Slot<G, 'expression.collection.tuple', 'attributes', V.Attribute.Any<G>>[];
			// r only
		}
	}
}
