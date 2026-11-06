import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace TypeParameter {
		export interface Value<G extends GrammarMap, K extends Under<'declaration.type_parameter.value'> = 'declaration.type_parameter.value'> extends SubKindOf<V.Declaration.TypeParameter<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly const?: never;
			readonly default?: Slot<
				G,
				K,
				'default',
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Block<G>
			>;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
			readonly type: Slot<
				G,
				K,
				'type',
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Type.Any<G>
			>;
		}
	}
}
