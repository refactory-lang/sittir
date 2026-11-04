import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Call {
		export interface Macro<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Call<G>> {
			// claimed by r
			readonly $kind: 'expression.call.macro';
			readonly arguments:
				| V.Element.Macro.TokenTree.Delimited.Brace<G>
				| V.Element.Macro.TokenTree.Delimited.Bracket<G>
				| V.Element.Macro.TokenTree.Delimited.Paren<G>;
			readonly function: G['identifier'];
		}
	}
}
