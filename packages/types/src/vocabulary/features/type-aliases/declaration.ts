import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface TypeAlias<G extends GrammarMap, K extends Under<'declaration.type_alias'> = 'declaration.type_alias'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly name?: Slot<G, K, 'name', V.Identifier.Any<G>>;
		readonly value?: Slot<
			G,
			K,
			'value',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
}
