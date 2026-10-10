import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Catch<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.catch';
		readonly body: V.Statement.Block<G>;
		readonly catchClauseGroup?: G['slots']['clause.catch']['catchClauseGroup'];
	}
	export interface Except<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.except';
		readonly exception?: G['slots']['clause.except']['exception'] | G['slots']['clause.except']['exception'][];
		readonly group?: boolean;
		readonly suite: G['slots']['clause.except']['suite'];
	}
	export interface Finally<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.finally';
		readonly block?: G['slots']['clause.finally']['block'];
		readonly body?: V.Statement.Block<G>;
	}
}
