import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Catch<G extends GrammarMap, K extends Under<'clause.catch'> = 'clause.catch'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by pt
		readonly $kind: K;
		readonly body: Slot<G, K, 'body', V.Declaration.TypeAlias<G> | V.Statement.Any<G>>;
		readonly group?: Flag;
		// p only
		readonly name?: Slot<
			G,
			K,
			'name',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		readonly type?: Slot<G, K, 'type', unknown> | Slot<G, K, 'type', unknown>[];
	}
	export interface Finally<G extends GrammarMap, K extends Under<'clause.finally'> = 'clause.finally'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by pt
		readonly $kind: K;
		readonly body: Slot<G, K, 'body', V.Declaration.TypeAlias<G> | V.Statement.Any<G>>;
	}
}
