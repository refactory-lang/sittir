import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Call {
		export interface Macro<G extends GrammarMap, K extends Under<'expression.call.macro'> = 'expression.call.macro'> extends SubKindOf<V.Expression.Call<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly arguments:
				Slot<
				G,
				K,
				'arguments',
				| V.Element.Macro.TokenTree.Delimited.Brace<G>
				| V.Element.Macro.TokenTree.Delimited.Bracket<G>
				| V.Element.Macro.TokenTree.Delimited.Paren<G>
			>;
			readonly function: Slot<G, K, 'function', V.Identifier.Any<G>>;
		}
	}
}
