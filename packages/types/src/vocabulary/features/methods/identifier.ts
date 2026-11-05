import type { GrammarContext } from '../../context.ts';
export namespace Identifier {
	// claimed by rt
	export type Receiver<G extends GrammarContext<G>> = G['texts']['identifier.receiver'];
}
