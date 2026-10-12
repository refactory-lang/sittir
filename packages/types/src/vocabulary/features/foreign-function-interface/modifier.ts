import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Modifier {
	export interface Extern<G extends GrammarContext<G>> extends SubKindOf<V.Modifier<G>> {
		// claimed by r
		readonly $kind: 'modifier.extern';
		readonly abi?: V.Literal.String<G>;
	}
}
