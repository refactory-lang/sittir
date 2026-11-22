import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Type {
		export namespace Interface {
			export interface Trait<G extends GrammarMap, K extends Under<'declaration.type.interface.trait'> = 'declaration.type.interface.trait'> extends SubKindOf<V.Declaration.Type.Interface<G, K>, 'extends' | 'members' | 'name' | 'typeParameters'> {
				// claimed by r
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
				readonly extends?: Slot<
					G,
					K,
					'extends',
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
}
