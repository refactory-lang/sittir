import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export interface F<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String<G>> {
			// claimed by p
			readonly $kind: 'literal.string.f';
		}
	}
	export interface Template<G extends GrammarContext<G>> extends SubKindOf<V.Literal<G>> {
		// claimed by t
		readonly $kind: 'literal.template';
		readonly elements?: G['slots']['literal.template']['elements'][];
	}
}
