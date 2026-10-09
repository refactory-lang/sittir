import type { GrammarContext } from '../../../../context.ts';
import type * as V from '../../../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarContext> {
		readonly extends?: V.Clause.Extends<G>;
	}
	export namespace Class {
		export interface Abstract<G extends GrammarContext> {
			readonly extends?: V.Clause.Extends<G>;
		}
	}
}
