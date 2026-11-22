import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Element {
	export interface TypeArgument<G extends GrammarMap, K extends Under<'element.type_argument'> = 'element.type_argument'> extends SubKindOf<V.Element<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly argument: Slot<G, K, 'argument', V.Type.AnyWithTypeArgument<G> | V.Clause.Bounds.Removed<G>>;
	}
}
