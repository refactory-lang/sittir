import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface TypeAlias<G extends GrammarMap, K extends Under<'declaration.type_alias'> = 'declaration.type_alias'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly name?: V.Identifier<G>;
		readonly value?: Slot<
			G,
			'declaration.type_alias',
			'value',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>;
	}
}
