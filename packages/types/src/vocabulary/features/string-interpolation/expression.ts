import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Interpolation<G extends GrammarMap, K extends Under<'expression.interpolation'> = 'expression.interpolation'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by pt
		readonly $path: K;
		readonly debug?: Flag;
		// p only
		readonly expression?: Slot<
			G,
			K,
			'expression',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		readonly formatSpecifier?: Slot<G, K, 'formatSpecifier', V.Expression.Interpolation.Format<G>>;
		// p only
		readonly typeConversion?: Slot<G, K, 'typeConversion', V.Expression.Interpolation.Conversion<G>>;
		// p only
	}
}
