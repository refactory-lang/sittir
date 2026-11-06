import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Attribute {
	export interface Inner<G extends GrammarMap, K extends Under<'attribute.inner'> = 'attribute.inner'> extends SubKindOf<V.Attribute<G, K>, 'content'> {
		// claimed by r
		readonly $kind: K;
		readonly content: V.Attribute.Content<G>;
	}
}
