import type { GrammarContext } from './context.ts';
import type * as V from './index.ts';
export interface Module<G extends GrammarContext<G>> {
	// claimed by prt
	readonly $kind: 'module';
	readonly statements?: G['slots']['module']['statements'][];
}

export namespace Module {
	export type Any<G extends GrammarContext<G>> = V.Module<G>;
}
