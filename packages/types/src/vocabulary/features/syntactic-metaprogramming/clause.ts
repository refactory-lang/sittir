import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Macro<G extends GrammarMap, K extends Under<'clause.macro'> = 'clause.macro'> extends SubKindOf<V.Clause<G, K>> {
		readonly $kind: K;
		readonly left:
			Slot<
			G,
			K,
			'left',
			| V.Element.Macro.TokenTree.Pattern.Brace<G>
			| V.Element.Macro.TokenTree.Pattern.Bracket<G>
			| V.Element.Macro.TokenTree.Pattern.Paren<G>
		>;
		// r only
		readonly right:
			Slot<
			G,
			K,
			'right',
			| V.Element.Macro.TokenTree.Brace<G>
			| V.Element.Macro.TokenTree.Bracket<G>
			| V.Element.Macro.TokenTree.Paren<G>
		>;
		// r only
	}
	export namespace Macro {
		export interface Rule<G extends GrammarMap, K extends Under<'clause.macro.rule'> = 'clause.macro.rule'> extends SubKindOf<V.Clause.Macro<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly left:
				Slot<
				G,
				K,
				'left',
				| V.Element.Macro.TokenTree.Pattern.Brace<G>
				| V.Element.Macro.TokenTree.Pattern.Bracket<G>
				| V.Element.Macro.TokenTree.Pattern.Paren<G>
			>;
			readonly right:
				Slot<
				G,
				K,
				'right',
				| V.Element.Macro.TokenTree.Brace<G>
				| V.Element.Macro.TokenTree.Bracket<G>
				| V.Element.Macro.TokenTree.Paren<G>
			>;
		}
	}
}
