import type { GrammarMap, Slot } from '../../../../map.ts';
import type { Under } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarMap, K extends Under<'declaration.class'> = 'declaration.class'> {
		readonly bases?: Slot<
			G,
			'declaration.class',
			'bases',
			| V.Argument.Any<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Element.Spread.Any<G>
		>[];
		// p only
	}
}
