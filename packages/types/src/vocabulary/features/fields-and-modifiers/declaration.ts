import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Field<G extends GrammarMap, K extends Under<'declaration.field'> = 'declaration.field'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by rt
		readonly $path: K;
		readonly name?: Slot<
			G,
			K,
			'name',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| string
			| V.Declaration.Module<G>
		>;
	}
}
