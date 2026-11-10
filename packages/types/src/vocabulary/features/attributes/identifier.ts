import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Identifier {
	export interface Metavariable<G extends GrammarMap, K extends Under<'identifier.metavariable'> = 'identifier.metavariable'> {
		readonly attributes?: Slot<G, K, 'attributes', V.Attribute.Any<G>>[];
	}
}
