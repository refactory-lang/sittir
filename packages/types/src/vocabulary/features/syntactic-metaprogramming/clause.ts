import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Macro<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.macro';
		readonly left:
			| V.Element.Macro.TokenTree.Pattern.Brace<G>
			| V.Element.Macro.TokenTree.Pattern.Bracket<G>
			| V.Element.Macro.TokenTree.Pattern.Paren<G>;
		// r only
		readonly right:
			| V.Element.Macro.TokenTree.Brace<G>
			| V.Element.Macro.TokenTree.Bracket<G>
			| V.Element.Macro.TokenTree.Paren<G>;
		// r only
	}
	export namespace Macro {
		export interface Rule<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Macro<G>> {
			// claimed by r
			readonly $kind: 'clause.macro.rule';
			readonly left:
				| V.Element.Macro.TokenTree.Pattern.Brace<G>
				| V.Element.Macro.TokenTree.Pattern.Bracket<G>
				| V.Element.Macro.TokenTree.Pattern.Paren<G>;
			readonly right:
				| V.Element.Macro.TokenTree.Brace<G>
				| V.Element.Macro.TokenTree.Bracket<G>
				| V.Element.Macro.TokenTree.Paren<G>;
		}
	}
}
