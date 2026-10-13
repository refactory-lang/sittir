import type { GrammarContext } from '../../../context.ts';
import type * as V from '../../../index.ts';
export namespace Element {
	export interface TypeArgument<G extends GrammarContext<G>> {
		readonly bounds?: G['slots']['clause.bounds']['bounds'][];
	}
}
