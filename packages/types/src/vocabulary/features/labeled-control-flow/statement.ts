import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Block<G extends GrammarMap, K extends Under<'statement.block'> = 'statement.block'> {
	}
	export interface Break<G extends GrammarMap, K extends Under<'statement.break'> = 'statement.break'> {
		readonly label?: Slot<G, K, 'label', V.Identifier.Label<G>>;
		// rt only
	}
	export interface Continue<G extends GrammarMap, K extends Under<'statement.continue'> = 'statement.continue'> {
		readonly label?: Slot<G, K, 'label', V.Identifier.Label<G>>;
		// rt only
	}
	export interface Loop<G extends GrammarMap, K extends Under<'statement.loop'> = 'statement.loop'> {
	}
	export namespace Loop {
		export interface ForEach<G extends GrammarMap, K extends Under<'statement.loop.for_each'> = 'statement.loop.for_each'> {
		}
		export interface While<G extends GrammarMap, K extends Under<'statement.loop.while'> = 'statement.loop.while'> {
		}
	}
}
