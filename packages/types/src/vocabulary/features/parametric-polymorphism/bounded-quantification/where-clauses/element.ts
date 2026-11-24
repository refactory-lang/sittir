import type { GrammarMap, Slot } from '../../../../map.ts';
import type { Under } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Element {
	export interface TypeArgument<G extends GrammarMap, K extends Under<'element.type_argument'> = 'element.type_argument'> {
		readonly bounds?: Slot<G, K, 'bounds', V.Type.AnyWithBounds<G>>[];
	}
}
