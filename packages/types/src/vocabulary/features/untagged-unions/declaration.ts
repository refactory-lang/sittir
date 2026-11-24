import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export namespace Type {
		export interface Union<G extends GrammarMap, K extends Under<'declaration.type.union'> = 'declaration.type.union'> extends SubKindOf<V.Declaration<G, K>> {
			// claimed by r
			readonly $path: K;
			readonly body: Slot<
				G,
				K,
				'body',
				| V.Declaration.Member.Field<G>
				| V.Declaration.Member.Field.Private<G>
				| V.Declaration.Member.Field.Public.Any<G>
			>[];
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		}
	}
}
