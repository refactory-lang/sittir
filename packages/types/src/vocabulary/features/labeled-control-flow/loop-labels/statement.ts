import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Statement {
	export interface Block<G extends GrammarMap, K extends Under<'statement.block'> = 'statement.block'> {
		readonly label?: Slot<G, K, 'label', V.Identifier.Label<G>>;
		// r only
	}
	export interface Loop<G extends GrammarMap, K extends Under<'statement.loop'> = 'statement.loop'> {
		readonly label?: Slot<G, K, 'label', V.Identifier.Label<G>>;
	}
	export namespace Loop {
		export interface ForEach<G extends GrammarMap, K extends Under<'statement.loop.for_each'> = 'statement.loop.for_each'> {
			readonly label?: Slot<G, K, 'label', V.Identifier.Label<G>>;
			// r only
		}
		export interface While<G extends GrammarMap, K extends Under<'statement.loop.while'> = 'statement.loop.while'> {
			readonly label?: Slot<G, K, 'label', V.Identifier.Label<G>>;
			// r only
		}
	}
}
