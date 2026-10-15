import type { GrammarContext } from '../../context.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Catch<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by pt
		readonly $kind: 'clause.catch';
		readonly body: G['slots']['clause.catch']['body'];
		readonly group?: Flag;
		// p only
		readonly name?: G['slots']['clause.catch']['name'];
		readonly type?: G['slots']['clause.catch']['type'] | G['slots']['clause.catch']['type'][];
	}
	export interface Finally<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by pt
		readonly $kind: 'clause.finally';
		readonly body: G['slots']['clause.finally']['body'];
	}
}
