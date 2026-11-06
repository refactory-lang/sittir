import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Struct<G extends GrammarMap, K extends Under<'declaration.struct'> = 'declaration.struct'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly body?: Slot<
			G,
			K,
			'body',
			| V.Declaration.Field<G>
			| V.Declaration.Field.Private<G>
			| V.Declaration.Field.Public.Any<G>
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
	export namespace Struct {
		export interface Tuple<G extends GrammarMap, K extends Under<'declaration.struct.tuple'> = 'declaration.struct.tuple'> extends SubKindOf<V.Declaration.Struct<G, K>> {
			// claimed by r
			readonly $path: K;
			readonly body: Slot<
				G,
				K,
				'body',
				| V.Declaration.Field<G>
				| V.Declaration.Field.Private<G>
				| V.Declaration.Field.Public.Any<G>
			>[];
		}
		export interface Unit<G extends GrammarMap, K extends Under<'declaration.struct.unit'> = 'declaration.struct.unit'> extends SubKindOf<V.Declaration.Struct<G, K>> {
			// claimed by r
			readonly $path: K;
		}
	}
}
