import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Call {
		export interface Macro<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Call<G>> {
			readonly $kind: 'expression.call.macro';
			readonly arguments: V.Element.Macro.TokenTree.Delimited<G>;
			readonly function: G['identifier'];
		}
	}
}
