import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Type {
	export type Expression<G extends GrammarMap> = V.Expression.Any<G>;
	export interface Constrained<G extends GrammarMap, K extends Under<'type.constrained'> = 'type.constrained'> extends SubKindOf<V.Type<G, K>> {
		// claimed by p
		readonly $path: K;
		readonly baseType: Slot<
			G,
			K,
			'baseType',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Rest<G>
			| V.Type.Any<G>
		>;
	}
}
