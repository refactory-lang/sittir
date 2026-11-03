import type { GrammarContext } from './context.ts';
export interface Argument<G extends GrammarContext<G>> {
	readonly $kind: 'argument';
	readonly value: G['slots']['argument']['value'];
	// r only
}

export interface ArgumentSynonyms {
	readonly named: 'keyword';
}
