import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Else<G extends GrammarMap, K extends Under<'clause.else'> = 'clause.else'> {
		readonly trailingExpression?: Slot<
			G,
			K,
			'trailingExpression',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
		>;
		// r only
	}
}
