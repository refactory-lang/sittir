import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Block<G extends GrammarMap> {
		readonly label?: V.Identifier.Label<G>;
		// r only
	}
	export interface Break<G extends GrammarMap> {
		readonly label?: V.Identifier.Label<G>;
		// rt only
	}
	export interface Continue<G extends GrammarMap> {
		readonly label?: V.Identifier.Label<G>;
		// rt only
	}
	export interface Labeled<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by t
		readonly $kind: 'statement.labeled';
		readonly body: Slot<G, 'statement.labeled', 'body', V.Declaration.Any<G> | V.Statement.Any<G>>;
		readonly label: Slot<G, 'statement.labeled', 'label', V.Identifier.Label<G> | string>;
	}
	export interface Loop<G extends GrammarMap> {
		readonly label?: V.Identifier.Label<G>;
	}
	export namespace Loop {
		export interface ForEach<G extends GrammarMap> {
			readonly label?: V.Identifier.Label<G>;
			// r only
		}
		export interface While<G extends GrammarMap> {
			readonly label?: V.Identifier.Label<G>;
			// r only
		}
	}
}
