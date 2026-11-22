import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Constant<G extends GrammarMap, K extends Under<'declaration.constant'> = 'declaration.constant'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by pr
		readonly $path: K;
		readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		// r only
		readonly value?: Slot<G, K, 'value', V.Expression.Any<G> | V.Declaration.Constant<G> | V.Declaration.Variable<G> | V.Pattern.Tuple.Bare<G>>;
		// r only
	}
	export namespace Member {
		export type Constant<G extends GrammarMap> = V.Declaration.Constant.Any<G>;
	}
}
