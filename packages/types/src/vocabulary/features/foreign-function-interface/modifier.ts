import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Modifier {
	export interface Extern<G extends GrammarMap, K extends Under<'modifier.extern'> = 'modifier.extern'> extends SubKindOf<V.Modifier<G, K>> {
		// claimed by r
		readonly $kind: K;
		readonly abi?: Slot<G, K, 'abi', V.Literal.String<G> | V.Literal.String.Bytes<G> | V.Literal.String.C<G>>;
	}
}
