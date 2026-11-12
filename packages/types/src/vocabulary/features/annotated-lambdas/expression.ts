import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Lambda<G extends GrammarMap, K extends Under<'expression.lambda'> = 'expression.lambda'> {
		readonly returnType?: Slot<
			G,
			K,
			'returnType',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
		// r only
	}
}
