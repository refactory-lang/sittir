import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export namespace Case {
		export interface Match<G extends GrammarMap> extends SubKindOf<V.Clause.Case<G>> {
			// claimed by pr
			readonly $kind: 'clause.case.match';
			readonly body: Slot<
				G,
				'clause.case.match',
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
				'clause.case.match',
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
				'clause.case.match',
				'pattern',
				| V.Pattern.Any<G>
				| V.Expression.Block.Const<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
		}
	}
	export interface Let<G extends GrammarMap> extends SubKindOf<V.Clause<G>> {
		// claimed by r
		readonly $kind: 'clause.let';
		readonly pattern?: Slot<G, 'clause.let', 'pattern', unknown>;
		readonly value?: Slot<
			G,
			'clause.let',
			'value',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
		>;
	}
	export namespace Let {
		export interface Chain<G extends GrammarMap> extends SubKindOf<V.Clause.Let<G>> {
			// claimed by r
			readonly $kind: 'clause.let.chain';
			readonly left: Slot<
				G,
				'clause.let.chain',
				'left',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Clause.Let.Any<G>
				| V.Statement.Any<G>
			>;
			readonly rights?: Slot<
				G,
				'clause.let.chain',
				'rights',
				| V.Clause.Let<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
			>[];
		}
	}
}
