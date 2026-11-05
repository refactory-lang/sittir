import type { GrammarContext } from '../../context.ts';
import type * as V from '../../index.ts';
export namespace Type {
	export interface Function<G extends GrammarContext<G>> {
		readonly receiver?: V.Declaration.Parameter.Receiver<G>;
		// t only
	}
	// claimed by t
	export type Receiver<G extends GrammarContext<G>> = G['texts']['type.receiver'];
}
