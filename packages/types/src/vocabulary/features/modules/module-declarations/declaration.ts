import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Module<G extends GrammarMap, K extends Under<'declaration.module'> = 'declaration.module'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by rt
		readonly $path: K;
		readonly body?:
			| Slot<G, K, 'body', V.Statement.Block<G>>
			| Slot<G, K, 'body', V.Attribute.Any<G> | V.Declaration.Any<G> | V.Expression.Call.Macro<G> | V.Statement.Any<G>>[];
		readonly name?: Slot<G, K, 'name', V.Identifier.Any<G> | V.Literal.String<G>>;
	}
}
