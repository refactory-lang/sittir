import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Union<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by r
		readonly $kind: 'declaration.union';
		readonly body: Slot<
			G,
			'declaration.union',
			'body',
			| V.Declaration.Field<G>
			| V.Declaration.Field.Private<G>
			| V.Declaration.Field.Public.Any<G>
		>[];
		readonly name: V.Identifier<G>;
	}
}
