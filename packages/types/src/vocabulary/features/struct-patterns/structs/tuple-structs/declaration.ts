import type { GrammarMap, Slot } from '../../../../map.ts';
import type { SubKindOf, Under } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Declaration {
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
