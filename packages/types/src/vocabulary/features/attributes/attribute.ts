import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Attribute {
	export interface Inner<G extends GrammarContext<G>> extends SubKindOf<V.Attribute<G>> {
		readonly $kind: 'attribute.inner';
		readonly content: V.Attribute.Content<G>;
	}
}
