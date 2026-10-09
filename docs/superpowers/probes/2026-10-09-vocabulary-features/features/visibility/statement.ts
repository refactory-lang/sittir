import type { GrammarContext } from '../../context.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Import<G extends GrammarContext> {
		readonly visibility?: V.AccessLevel;
		readonly visibilityScope?: G['identifier'];
	}
	export namespace Import {
		export interface Crate<G extends GrammarContext> {
			readonly visibility?: V.AccessLevel;
			readonly visibilityScope?: G['identifier'];
		}
	}
}
