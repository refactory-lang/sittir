import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Argument<G extends GrammarContext<G>> {
	readonly $kind: 'argument';
	readonly name: G['identifier'];
	// p only
	readonly value: G['slots']['argument']['value'];
	// p only
}

export namespace Argument {
	export interface Keyword<G extends GrammarContext<G>> extends SubKindOf<V.Argument<G>> {
		// claimed by p
		readonly $kind: 'argument.keyword';
		readonly name: G['identifier'];
		readonly value: G['slots']['argument.keyword']['value'];
	}
	export type Any<G extends GrammarContext<G>> = V.Argument.Keyword<G>;
}
