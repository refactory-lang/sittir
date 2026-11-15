import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Identifier {
	export interface Label<G extends GrammarMap, K extends Under<'identifier.label'> = 'identifier.label'> extends SubKindOf<V.Identifier<G, K>, '$value'> {
		// claimed by rt
		readonly $path: K;
		readonly $value?: never;
		readonly name?: Slot<G, K, 'name', V.Identifier.Any<G>>;
		// r only
	}
}
