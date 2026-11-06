import type { GrammarMap, Slot } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Identifier {
	export interface Metavariable<G extends GrammarMap> {
		readonly attributes?: Slot<G, 'identifier.metavariable', 'attributes', V.Attribute.Any<G>>[];
	}
}
