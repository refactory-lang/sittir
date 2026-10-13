import type { GrammarContext } from './context.ts';
export interface File<G extends GrammarContext<G>> {
	// claimed by prt
	readonly $kind: 'file';
	readonly statements?: G['slots']['file']['statements'][];
}

