import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Module<G extends GrammarMap, K extends Under<'declaration.module'> = 'declaration.module'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by rt
		readonly $path: K;
		readonly name?: Slot<G, K, 'name', V.Identifier.Any<G> | V.Literal.String<G>>;
		readonly statements?: Slot<
			G,
			K,
			'statements',
			| V.Attribute.Any<G>
			| V.Declaration.Any<G>
			| V.Expression.Call.Macro<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Rest<G>
			| V.Statement.Any<G>
		>[];
	}
}
