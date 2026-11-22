import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
	}
	export namespace Member {
		export interface Method<G extends GrammarMap, K extends Under<'declaration.member.method'> = 'declaration.member.method'> extends SubKindOf<V.Declaration<G, K>> {
			// claimed by prt
			readonly $path: K;
			readonly default?: Flag;
			// rt only
			readonly doc?: Slot<G, K, 'doc', V.Literal.String.Any<G>>;
			// pt only
			readonly name: Slot<G, K, 'name', V.Expression.Any<G> | string>;
			readonly parameters: Slot<G, K, 'parameters', V.Declaration.Parameter.AnyWithType<G> | V.Clause.Bounds.Removed<G> | string>[];
			readonly statements?: Slot<G, K, 'statements', V.Statement.Any<G>>[];
			readonly static?: Flag;
			// pt only
		}
	}
}
