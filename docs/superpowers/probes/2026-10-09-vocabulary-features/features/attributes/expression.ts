import type { GrammarContext } from '../../context.ts';
export namespace Expression {
	export namespace Collection {
		export interface Tuple<G extends GrammarContext> {
			readonly attributes?: G['attribute'][];
		}
	}
}
