import type { GrammarMap, Slot } from './map.ts';
import type * as V from './index.ts';
export interface Argument<G extends GrammarMap> {
	readonly $kind: 'argument';
	readonly value: Slot<
		G,
		'argument',
		'value',
		| V.Expression.Any<G>
		| V.Identifier.Any<G>
		| V.Literal.Any<G>
		| V.Pattern.Any<G>
		| V.Statement.Any<G>
	>;
	// r only
}

export interface ArgumentSynonyms {
	readonly named: 'keyword';
}
