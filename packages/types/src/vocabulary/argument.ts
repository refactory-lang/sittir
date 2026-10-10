import type { GrammarContext } from './context.ts';
export interface Argument<G extends GrammarContext<G>> {
	readonly $kind: 'argument';
	readonly name: G['identifier'];
	// p only
	readonly value: G['slots']['argument']['value'];
	// p only
}
