import type { GrammarContext } from '../../../../context.ts';
import type * as V from '../../../../index.ts';
export namespace Expression {
	export interface Class<G extends GrammarContext> {
		readonly extends?: V.Clause.Extends<G>;
	}
}
