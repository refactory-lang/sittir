import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export namespace Case {
		export interface Default<G extends GrammarMap> extends SubKindOf<V.Clause.Case<G>> {
			// claimed by t
			readonly $kind: 'clause.case.default';
			readonly bodies?: Slot<G, 'clause.case.default', 'bodies', V.Declaration.Any<G> | V.Statement.Any<G>>[];
		}
		export interface Switch<G extends GrammarMap> extends SubKindOf<V.Clause.Case<G>> {
			// claimed by t
			readonly $kind: 'clause.case.switch';
			readonly bodies?: Slot<G, 'clause.case.switch', 'bodies', V.Declaration.Any<G> | V.Statement.Any<G>>[];
			readonly value: Slot<
				G,
				'clause.case.switch',
				'value',
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
		}
	}
}
