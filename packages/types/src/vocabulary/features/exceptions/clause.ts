import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Catch<G extends GrammarMap> extends SubKindOf<V.Clause<G>> {
		// claimed by pt
		readonly $kind: 'clause.catch';
		readonly body: Slot<G, 'clause.catch', 'body', V.Declaration.TypeAlias<G> | V.Statement.Any<G>>;
		readonly group?: Flag;
		// p only
		readonly name?: Slot<
			G,
			'clause.catch',
			'name',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		readonly type?: Slot<G, 'clause.catch', 'type', unknown> | Slot<G, 'clause.catch', 'type', unknown>[];
	}
	export interface Finally<G extends GrammarMap> extends SubKindOf<V.Clause<G>> {
		// claimed by pt
		readonly $kind: 'clause.finally';
		readonly body: Slot<G, 'clause.finally', 'body', V.Declaration.TypeAlias<G> | V.Statement.Any<G>>;
	}
}
