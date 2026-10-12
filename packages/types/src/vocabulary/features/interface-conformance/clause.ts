import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Implements<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by t
		readonly $kind: 'clause.implements';
		readonly types: G['slots']['clause.implements']['types'][];
	}
}
