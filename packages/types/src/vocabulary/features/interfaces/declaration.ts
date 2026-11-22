import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export namespace Type {
		export interface Interface<G extends GrammarMap, K extends Under<'declaration.type.interface'> = 'declaration.type.interface'> extends SubKindOf<V.Declaration<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly members: Slot<
				G,
				K,
				'members',
				| V.Attribute.Any<G>
				| V.Declaration.Any<G>
				| V.Expression.Call.Macro<G>
				| V.Statement.Any<G>
			>[];
			// rt only
			readonly extends?: Slot<
				G,
				K,
				'extends',
				| V.Identifier<G>
				| V.Type.Any<G>
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Clause.Bounds.HigherRanked<G>
				| V.Clause.Bounds.Removed<G>
			>[];
			// rt only
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
			// rt only
		}
	}
}
