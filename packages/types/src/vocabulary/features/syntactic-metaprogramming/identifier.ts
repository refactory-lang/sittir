import type { GrammarMap } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Identifier {
	export interface Metavariable<G extends GrammarMap> extends SubKindOf<V.Identifier<G>> {
		// claimed by r
		readonly $kind: 'identifier.metavariable';
	}
}
