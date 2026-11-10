import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Lambda<G extends GrammarMap, K extends Under<'expression.lambda'> = 'expression.lambda'> {
	}
	export interface Yield<G extends GrammarMap, K extends Under<'expression.yield'> = 'expression.yield'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly content?: Slot<
			G,
			K,
			'content',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		// p only
		readonly expression?: Slot<
			G,
			K,
			'expression',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
		>;
		// rt only
	}
}
