import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export interface Raw<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String<G>> {
			readonly $kind: 'literal.string.raw';
			readonly content: G['slots']['literal.string.raw']['content'];
		}
	}
}
