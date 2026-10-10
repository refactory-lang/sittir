import type { GrammarContext } from './context.ts';
export interface Module<G extends GrammarContext<G>> {
	// claimed by prt
	readonly $kind: 'module';
	readonly statements?: G['slots']['module']['statements'][];
}
