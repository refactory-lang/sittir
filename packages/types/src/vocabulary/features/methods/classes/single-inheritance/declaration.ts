import type { GrammarMap } from '../../../../map.ts';
import type * as V from '../../../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarMap> {
		readonly extends?: V.Clause.Extends<G>;
		// t only
	}
}
