import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Union<G extends GrammarMap, K extends Under<'declaration.union'> = 'declaration.union'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by r
		readonly $kind: K;
		readonly body: Slot<
			G,
			K,
			'body',
			| V.Declaration.Field<G>
			| V.Declaration.Field.Private<G>
			| V.Declaration.Field.Public.Any<G>
		>[];
		readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
	}
}
