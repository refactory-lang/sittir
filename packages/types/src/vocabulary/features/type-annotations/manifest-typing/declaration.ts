import type { GrammarMap, Slot } from '../../../map.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Constant<G extends GrammarMap> {
		readonly type: Slot<
			G,
			'declaration.constant',
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
	export interface Field<G extends GrammarMap> {
		readonly type: Slot<
			G,
			'declaration.field',
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
}
