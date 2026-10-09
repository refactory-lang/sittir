import type { GrammarContext } from '../../../context.ts';
import type * as V from '../../../index.ts';
export namespace Type {
	export interface Function<G extends GrammarContext> {
		readonly forLifetimes?: V.Clause.Lifetimes<G>;
	}
	export interface Reference<G extends GrammarContext> {
		readonly lifetime?: V.Identifier.Lifetime<G>;
	}
}
