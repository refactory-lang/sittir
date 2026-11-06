import type { GrammarMap, Slot } from './map.ts';
import type { Under } from './utils.ts';
import type * as V from './index.ts';
export interface Attribute<G extends GrammarMap, K extends Under<'attribute'> = 'attribute'> {
	// claimed by r
	readonly $path: K;
	readonly content?: Slot<
		G,
		K,
		'content',
		| V.Expression.Any<G>
		| V.Identifier.Any<G>
		| V.Literal.Any<G>
		| V.Pattern.Any<G>
		| V.Attribute.Content.Any<G>
	>;
	// prt only
}

