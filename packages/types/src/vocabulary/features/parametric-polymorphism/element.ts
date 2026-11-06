import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export interface TypeArgument<G extends GrammarMap, K extends Under<'element.type_argument'> = 'element.type_argument'> extends SubKindOf<V.Element<G, K>> {
		// claimed by r
		readonly $kind: K;
		readonly content: Slot<
			G,
			K,
			'content',
			| V.Clause.Bounds.Removed<G>
			| V.Element.TypeBinding<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Block<G>
			| V.Type.Any<G>
		>;
	}
}
