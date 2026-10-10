import type { GrammarContext } from '../../context.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Import<G extends GrammarContext<G>> {
		readonly visibility?: V.AccessLevel;
	}
	export namespace Import {
		export interface Crate<G extends GrammarContext<G>> {
			readonly visibility?: V.AccessLevel;
		}
	}
}
