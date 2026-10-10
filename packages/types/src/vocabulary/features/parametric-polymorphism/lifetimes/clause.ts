import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Clause {
	export interface Lifetimes<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.lifetimes';
		readonly lifetimes: V.Identifier.Lifetime<G>[];
	}
}
