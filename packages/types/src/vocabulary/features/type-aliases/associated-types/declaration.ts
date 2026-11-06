import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace TypeAlias {
		export interface Associated<G extends GrammarMap, K extends Under<'declaration.type_alias.associated'> = 'declaration.type_alias.associated'> extends SubKindOf<V.Declaration.TypeAlias<G, K>, 'typeParameters'> {
			// claimed by r
			readonly $path: K;
			readonly bounds?: Slot<
				G,
				K,
				'bounds',
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Clause.Bounds.HigherRanked<G>
				| V.Clause.Bounds.Removed<G>
				| V.Type.Any<G>
			>[];
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		}
	}
}
