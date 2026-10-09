import type { GrammarContext } from '../../../context.ts';
import type * as V from '../../../index.ts';
export namespace Element {
	export interface TypeArgument<G extends GrammarContext> {
		readonly constraint?: V.Clause.Bounds<G>;
	}
}
