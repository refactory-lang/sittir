import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Identifier {
	export interface Metavariable<G extends GrammarMap, K extends Under<'identifier.metavariable'> = 'identifier.metavariable'> extends SubKindOf<V.Identifier<G, K>> {
		// claimed by r
		readonly $kind: K;
	}
}
