import type { GrammarContext } from './context.ts';
export interface Type<G extends GrammarContext<G>> {
	// claimed by p
	readonly $kind: 'type';
	readonly content?: G['slots']['type']['content'] | G['slots']['type']['content'][];
	// prt only
}
