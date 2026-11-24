import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Type {
		export interface Struct<G extends GrammarMap, K extends Under<'declaration.type.struct'> = 'declaration.type.struct'> extends SubKindOf<V.Declaration<G, K>> {
			// claimed by r
			readonly $path: K;
			readonly fields?: Slot<
				G,
				K,
				'fields',
				| V.Declaration.Member.Field<G>
				| V.Declaration.Member.Field.Private<G>
				| V.Declaration.Member.Field.Public.Any<G>
			>[];
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
			readonly typeParameters?: Slot<
				G,
				K,
				'typeParameters',
				| V.Identifier.Metavariable<G>
				| V.Declaration.TypeParameter<G>
				| V.Declaration.TypeParameter.Lifetime<G>
				| V.Declaration.TypeParameter.Value<G>
			>[];
			readonly whereClause?: Slot<G, K, 'whereClause', V.Clause.Where<G>>;
		}
	}
}
