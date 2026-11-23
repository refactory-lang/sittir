import type { GrammarMap, Slot } from '../../../../map.ts';
import type { SubKindOf, Under } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Declaration {
	export namespace Type {
		export namespace Struct {
			export interface Tuple<G extends GrammarMap, K extends Under<'declaration.type.struct.tuple'> = 'declaration.type.struct.tuple'> extends SubKindOf<V.Declaration.Type.Struct<G, K>, 'fields'> {
				// claimed by r
				readonly $path: K;
				readonly fields: Slot<
					G,
					K,
					'fields',
					| V.Declaration.Member.Field<G>
					| V.Declaration.Member.Field.Private<G>
					| V.Declaration.Member.Field.Public.Any<G>
				>[];
			}
			export interface Unit<G extends GrammarMap, K extends Under<'declaration.type.struct.unit'> = 'declaration.type.struct.unit'> extends SubKindOf<V.Declaration.Type.Struct<G, K>> {
				// claimed by r
				readonly $path: K;
			}
		}
	}
}
