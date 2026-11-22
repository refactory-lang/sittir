import type { GrammarMap } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export type AnyWithArgument<G extends GrammarMap> = V.Expression.Any<G> | V.Argument.Any<G> | V.Element.Spread.Any<G>;
	export type AnyWithSpread<G extends GrammarMap> = V.Expression.Any<G> | V.Element.Spread.Any<G> | V.Element.Attributed<G>;
}
