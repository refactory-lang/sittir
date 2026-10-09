import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Macro<G extends GrammarContext> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.macro';
		readonly left: V.Element.Macro.TokenTree.Pattern<G>;
		readonly right: V.Element.Macro.TokenTree<G>;
	}
	export namespace Macro {
		export interface Rule<G extends GrammarContext> extends SubKindOf<V.Clause.Macro<G>> {
			readonly $kind: 'clause.macro.rule';
			readonly left: V.Element.Macro.TokenTree.Pattern<G>;
			readonly right: V.Element.Macro.TokenTree<G>;
		}
	}
}
