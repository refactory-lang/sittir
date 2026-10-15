import type { GrammarContext } from '../../../../context.ts';
import type * as V from '../../../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarContext<G>> {
		readonly extends?: V.Clause.Extends<G>;
		// t only
	}
}
