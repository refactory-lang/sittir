import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface ElseIf<G extends GrammarMap, K extends Under<'clause.else_if'> = 'clause.else_if'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by p
		readonly $path: K;
		readonly condition: Slot<
			G,
			K,
			'condition',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		readonly consequence: Slot<G, K, 'consequence', V.Declaration.TypeAlias<G> | V.Statement.Any<G>>;
	}
}
