import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Resource<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by p
		readonly $kind: 'clause.resource';
		readonly items: V.Clause.Resource.Item<G>[];
	}
	export namespace Resource {
		export interface Item<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Resource<G>> {
			// claimed by p
			readonly $kind: 'clause.resource.item';
			readonly name?: G['slots']['clause.resource.item']['name'];
			readonly value: G['slots']['clause.resource.item']['value'];
		}
	}
}
