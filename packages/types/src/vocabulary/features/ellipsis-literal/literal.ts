import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export interface Ellipsis<G extends GrammarMap, K extends Under<'literal.ellipsis'> = 'literal.ellipsis'> extends SubKindOf<V.Literal<G, K>> {
		// claimed by p
		readonly $path: K;
	}
}
