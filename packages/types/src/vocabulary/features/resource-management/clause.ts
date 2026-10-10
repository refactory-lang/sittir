import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface With<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.with';
	}
	export namespace With {
		export interface Item<G extends GrammarContext<G>> extends SubKindOf<V.Clause.With<G>> {
			readonly $kind: 'clause.with.item';
			readonly value: G['slots']['clause.with.item']['value'];
		}
	}
}
