import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Element {
	export interface TypeBinding<G extends GrammarMap> extends SubKindOf<V.Element<G>> {
		// claimed by r
		readonly $kind: 'element.type_binding';
		readonly name: V.Identifier<G>;
		readonly type: Slot<
			G,
			'element.type_binding',
			'type',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
		readonly typeArguments?: V.Element.TypeArgument<G>[];
	}
}
