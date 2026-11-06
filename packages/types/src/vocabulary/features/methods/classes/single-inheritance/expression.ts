import type { GrammarMap } from '../../../../map.ts';
import type * as V from '../../../../index.ts';
export namespace Expression {
	export interface Class<G extends GrammarMap> {
		readonly extends?: V.Clause.Extends<G>;
	}
}
