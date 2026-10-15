import type { GrammarContext } from '../../../context.ts';
export namespace Declaration {
	export interface Field<G extends GrammarContext<G>> {
		readonly type: G['slots']['declaration.field']['type'];
	}
}
