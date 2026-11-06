import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace TypeAlias {
		export interface Associated<G extends GrammarMap> extends SubKindOf<V.Declaration.TypeAlias<G>, 'typeParameters'> {
			// claimed by r
			readonly $kind: 'declaration.type_alias.associated';
			readonly bounds?: Slot<
				G,
				'declaration.type_alias.associated',
				'bounds',
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Clause.Bounds.HigherRanked<G>
				| V.Clause.Bounds.Removed<G>
				| V.Type.Any<G>
			>[];
			readonly name: V.Identifier<G>;
		}
	}
}
