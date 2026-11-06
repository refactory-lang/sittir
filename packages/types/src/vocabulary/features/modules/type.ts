import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Type {
	export interface Import<G extends GrammarMap, K extends Under<'type.import'> = 'type.import'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly source: V.Literal.String<G>;
	}
}
