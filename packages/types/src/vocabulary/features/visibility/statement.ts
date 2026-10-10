import type { GrammarContext } from '../../context.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Import<G extends GrammarContext<G>> {
		readonly visibility?: V.Modifier.Visibility<G>;
	}
	export namespace Import {
		export interface Crate<G extends GrammarContext<G>> {
			readonly visibility?: V.Modifier.Visibility<G>;
		}
	}
}
