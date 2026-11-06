import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export namespace Case {
		export interface Default<G extends GrammarMap, K extends Under<'clause.case.default'> = 'clause.case.default'> extends SubKindOf<V.Clause.Case<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly bodies?: Slot<G, K, 'bodies', V.Declaration.Any<G> | V.Statement.Any<G>>[];
		}
		export interface Switch<G extends GrammarMap, K extends Under<'clause.case.switch'> = 'clause.case.switch'> extends SubKindOf<V.Clause.Case<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly bodies?: Slot<G, K, 'bodies', V.Declaration.Any<G> | V.Statement.Any<G>>[];
			readonly value: Slot<
				G,
				K,
				'value',
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
		}
	}
}
