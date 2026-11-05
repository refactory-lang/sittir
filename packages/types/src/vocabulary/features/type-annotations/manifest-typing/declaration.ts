import type { GrammarContext } from '../../../context.ts';
export namespace Declaration {
	export interface Constant<G extends GrammarContext<G>> {
		readonly type: G['slots']['declaration.constant']['type'];
	}
	export interface Field<G extends GrammarContext<G>> {
		readonly type: G['slots']['declaration.field']['type'];
	}
}
