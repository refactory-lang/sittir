import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export interface Concatenated<G extends GrammarMap, K extends Under<'literal.string.concatenated'> = 'literal.string.concatenated'> extends SubKindOf<V.Literal.String<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly strings: Slot<
				G,
				K,
				'strings',
				| V.Literal.String<G>
				| V.Literal.String.Multiline<G>
				| V.Literal.String.Raw.Any<G>
				| V.Literal.String.Bytes.Any<G>
				| V.Literal.String.Interpolated.Any<G>
				| V.Literal.String.Unicode<G>
			>[];
		}
	}
}
