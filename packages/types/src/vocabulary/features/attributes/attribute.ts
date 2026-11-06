import type { GrammarMap } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Attribute {
	export interface Inner<G extends GrammarMap> extends SubKindOf<V.Attribute<G>, 'content'> {
		// claimed by r
		readonly $kind: 'attribute.inner';
		readonly content: V.Attribute.Content<G>;
	}
}
