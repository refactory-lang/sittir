import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export interface Char<G extends GrammarContext<G>> extends SubKindOf<V.Literal<G>> {
		readonly $kind: 'literal.char';
	}
}
