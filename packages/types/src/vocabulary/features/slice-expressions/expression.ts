import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Slice<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by p
		readonly $kind: 'expression.slice';
		readonly start?: Slot<
			G,
			'expression.slice',
			'start',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		readonly step?: Slot<
			G,
			'expression.slice',
			'step',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		readonly stop?: Slot<
			G,
			'expression.slice',
			'stop',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
	}
}
