import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Block<G extends GrammarMap, K extends Under<'statement.block'> = 'statement.block'> {
		readonly label?: V.Identifier.Label<G>;
		// r only
	}
	export interface Break<G extends GrammarMap, K extends Under<'statement.break'> = 'statement.break'> {
		readonly label?: V.Identifier.Label<G>;
		// rt only
	}
	export interface Continue<G extends GrammarMap, K extends Under<'statement.continue'> = 'statement.continue'> {
		readonly label?: V.Identifier.Label<G>;
		// rt only
	}
	export interface Labeled<G extends GrammarMap, K extends Under<'statement.labeled'> = 'statement.labeled'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly body: Slot<G, 'statement.labeled', 'body', V.Declaration.Any<G> | V.Statement.Any<G>>;
		readonly label: Slot<G, 'statement.labeled', 'label', V.Identifier.Label<G> | string>;
	}
	export interface Loop<G extends GrammarMap, K extends Under<'statement.loop'> = 'statement.loop'> {
		readonly label?: V.Identifier.Label<G>;
	}
	export namespace Loop {
		export interface ForEach<G extends GrammarMap, K extends Under<'statement.loop.for_each'> = 'statement.loop.for_each'> {
			readonly label?: V.Identifier.Label<G>;
			// r only
		}
		export interface While<G extends GrammarMap, K extends Under<'statement.loop.while'> = 'statement.loop.while'> {
			readonly label?: V.Identifier.Label<G>;
			// r only
		}
	}
}
