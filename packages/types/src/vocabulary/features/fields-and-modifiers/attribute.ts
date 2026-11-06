import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Attribute {
	export interface Content<G extends GrammarMap, K extends Under<'attribute.content'> = 'attribute.content'> extends SubKindOf<V.Attribute<G, K>> {
		// claimed by r
		readonly $path: K;
	}
}
