import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Comprehension<G extends GrammarMap, K extends Under<'clause.comprehension'> = 'clause.comprehension'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by p
		readonly $path: K;
		readonly contents?: Slot<G, K, 'contents', V.Clause.Comprehension.For<G> | V.Clause.Comprehension.If<G>>[];
	}
	export namespace Comprehension {
		export interface For<G extends GrammarMap, K extends Under<'clause.comprehension.for'> = 'clause.comprehension.for'> extends SubKindOf<V.Clause.Comprehension<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly trailingComma?: Flag;
			readonly left: Slot<
				G,
				K,
				'left',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Pattern.Any<G>
			>;
			readonly rights: Slot<
				G,
				K,
				'rights',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
			>[];
		}
		export interface If<G extends GrammarMap, K extends Under<'clause.comprehension.if'> = 'clause.comprehension.if'> extends SubKindOf<V.Clause.Comprehension<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly condition: Slot<
				G,
				K,
				'condition',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
			>;
		}
	}
}
