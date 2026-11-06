import type { GrammarMap } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Modifier {
	export interface Extern<G extends GrammarMap> extends SubKindOf<V.Modifier<G>> {
		// claimed by r
		readonly $kind: 'modifier.extern';
		readonly abi?: V.Literal.String<G> | V.Literal.String.Bytes<G> | V.Literal.String.C<G>;
	}
}
