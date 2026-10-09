import type { GrammarContext } from '../../context.ts';
export namespace Expression {
	export interface Class<G extends GrammarContext> {
		readonly implements?: G['slots']['expression.class']['implements'][];
	}
}
