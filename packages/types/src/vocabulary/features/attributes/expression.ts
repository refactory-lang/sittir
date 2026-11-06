import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Collection {
		export interface List<G extends GrammarMap, K extends Under<'expression.collection.list'> = 'expression.collection.list'> {
			readonly attributes?: Slot<G, K, 'attributes', V.Attribute.Any<G>>[];
			// r only
		}
		export interface Tuple<G extends GrammarMap, K extends Under<'expression.collection.tuple'> = 'expression.collection.tuple'> {
			readonly attributes?: Slot<G, K, 'attributes', V.Attribute.Any<G>>[];
			// r only
		}
	}
}
