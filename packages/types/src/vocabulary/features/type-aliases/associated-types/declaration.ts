import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Type {
		export namespace TypeAlias {
			export interface Associated<G extends GrammarMap, K extends Under<'declaration.type.type_alias.associated'> = 'declaration.type.type_alias.associated'> extends SubKindOf<V.Declaration.Type.TypeAlias<G, K>, 'name' | 'typeParameters' | 'whereClause'> {
				// claimed by r
				readonly $path: K;
				readonly bounds?: Slot<G, K, 'bounds', V.Type.AnyWithBounds<G>>[];
				readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
			}
		}
	}
	export namespace Member {
		export type TypeAlias<G extends GrammarMap> = V.Declaration.Type.TypeAlias.Any<G>;
	}
}
