import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace TypeParameter {
		export interface Value<G extends GrammarMap, K extends Under<'declaration.type_parameter.value'> = 'declaration.type_parameter.value'> extends SubKindOf<V.Declaration.TypeParameter<G, K>, 'attributes' | 'default' | 'name'> {
			// claimed by r
			readonly $kind: K;
			readonly const?: never;
			readonly default?: Slot<
				G,
				'declaration.type_parameter.value',
				'default',
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Block<G>
			>;
			readonly name: Slot<G, 'declaration.type_parameter.value', 'name', V.Identifier.Any<G>>;
			readonly type: Slot<
				G,
				'declaration.type_parameter.value',
				'type',
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Type.Any<G>
			>;
		}
	}
}
