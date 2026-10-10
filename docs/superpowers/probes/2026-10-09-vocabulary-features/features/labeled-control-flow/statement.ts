import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Block<G extends GrammarContext> {
		readonly label?: V.Identifier.Label<G>;
	}
	export interface Break<G extends GrammarContext> {
		readonly label?: V.Identifier.Label<G>;
	}
	export interface Continue<G extends GrammarContext> {
		readonly label?: V.Identifier.Label<G>;
	}
	export interface Labeled<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		readonly $kind: 'statement.labeled';
		readonly body: G['slots']['statement.labeled']['body'];
		readonly label: G['slots']['statement.labeled']['label'];
	}
	export interface Loop<G extends GrammarContext> {
		readonly label?: V.Identifier.Label<G>;
	}
	export namespace Loop {
		export interface For<G extends GrammarContext> {
			readonly label?: V.Identifier.Label<G>;
		}
		export interface While<G extends GrammarContext> {
			readonly label?: V.Identifier.Label<G>;
		}
	}
}
