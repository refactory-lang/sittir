import type { GrammarMap, Slot } from '../../../map.ts';
import type * as V from '../../../index.ts';
export namespace Type {
	export interface Constrained<G extends GrammarMap> {
		readonly constraint: Slot<G, 'type.constrained', 'constraint', V.Type.Any<G>>;
	}
}
