import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Comprehension<G extends GrammarMap> extends SubKindOf<V.Clause<G>> {
		// claimed by p
		readonly $kind: 'clause.comprehension';
		readonly contents?: (V.Clause.Comprehension.For<G> | V.Clause.Comprehension.If<G>)[];
	}
	export namespace Comprehension {
		export interface For<G extends GrammarMap> extends SubKindOf<V.Clause.Comprehension<G>> {
			// claimed by p
			readonly $kind: 'clause.comprehension.for';
			readonly trailingComma?: Flag;
			readonly left: Slot<
				G,
				'clause.comprehension.for',
				'left',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Pattern.Any<G>
			>;
			readonly rights: Slot<
				G,
				'clause.comprehension.for',
				'rights',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
			>[];
		}
		export interface If<G extends GrammarMap> extends SubKindOf<V.Clause.Comprehension<G>> {
			// claimed by p
			readonly $kind: 'clause.comprehension.if';
			readonly condition: Slot<
				G,
				'clause.comprehension.if',
				'condition',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
			>;
		}
	}
}
