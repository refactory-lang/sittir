import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export namespace Case {
		export interface Match<G extends GrammarMap, K extends Under<'clause.case.match'> = 'clause.case.match'> extends SubKindOf<V.Clause.Case<G, K>> {
			// claimed by pr
			readonly $path: K;
			readonly body: Slot<
				G,
				K,
				'body',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
				| V.Declaration.TypeAlias<G>
				| V.Type.Primitive<G>
			>;
			readonly guard?: Slot<
				G,
				K,
				'guard',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Clause.Let.Any<G>
				| V.Pattern.Rest<G>
				| V.Statement.Any<G>
			>;
			readonly pattern: Slot<
				G,
				K,
				'pattern',
				| V.Pattern.Any<G>
				| V.Expression.Block.Const<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
		}
	}
}
