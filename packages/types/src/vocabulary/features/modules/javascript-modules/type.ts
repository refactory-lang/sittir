import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Type {
	export interface Import<G extends GrammarMap, K extends Under<'type.import'> = 'type.import'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly source: Slot<
			G,
			K,
			'source',
			| V.Literal.String<G>
			| V.Declaration.Module<G>
			| V.Element.Spread<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
		>;
	}
}
