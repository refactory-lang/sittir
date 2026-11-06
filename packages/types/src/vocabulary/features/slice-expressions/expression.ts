import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Slice<G extends GrammarMap, K extends Under<'expression.slice'> = 'expression.slice'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by p
		readonly $path: K;
		readonly start?: Slot<
			G,
			K,
			'start',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		readonly step?: Slot<
			G,
			K,
			'step',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		readonly stop?: Slot<
			G,
			K,
			'stop',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
	}
}
