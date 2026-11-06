import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export interface TypeArgument<G extends GrammarMap> extends SubKindOf<V.Element<G>> {
		// claimed by r
		readonly $kind: 'element.type_argument';
		readonly content: Slot<
			G,
			'element.type_argument',
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
