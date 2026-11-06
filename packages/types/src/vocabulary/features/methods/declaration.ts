import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
	}
	export interface Method<G extends GrammarMap, K extends Under<'declaration.method'> = 'declaration.method'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly body?: Slot<G, K, 'body', V.Declaration.TypeAlias<G> | V.Statement.Any<G>>;
		readonly default?: Flag;
		// rt only
		readonly doc?: Slot<G, K, 'doc', V.Literal.String.Any<G>>;
		// pt only
		readonly name: Slot<
			G,
			K,
			'name',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| string
			| V.Declaration.Module<G>
		>;
		readonly parameters: Slot<
			G,
			K,
			'parameters',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Pattern.Any<G>
			| V.Declaration.Parameter.Any<G>
			| string
			| V.Type.Any<G>
		>[];
		readonly static?: Flag;
		// t only
	}
}
