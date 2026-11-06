import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Element {
	export interface TypeBinding<G extends GrammarMap, K extends Under<'element.type_binding'> = 'element.type_binding'> extends SubKindOf<V.Element<G, K>> {
		// claimed by r
		readonly $kind: K;
		readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		readonly type: Slot<
			G,
			K,
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
		readonly typeArguments?: Slot<G, K, 'typeArguments', V.Element.TypeArgument<G>>[];
	}
}
