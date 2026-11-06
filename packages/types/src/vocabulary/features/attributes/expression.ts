import type { GrammarContext } from '../../context.ts';
export namespace Expression {
	export namespace Collection {
		export interface List<G extends GrammarContext<G>> {
			readonly attributes?: G['attribute'][];
			// r only
		}
		export interface Tuple<G extends GrammarContext<G>> {
			readonly attributes?: G['attribute'][];
			// r only
		}
	}
}
