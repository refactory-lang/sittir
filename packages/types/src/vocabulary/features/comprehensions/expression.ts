import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Comprehension<G extends GrammarMap, K extends Under<'expression.comprehension'> = 'expression.comprehension'> extends SubKindOf<V.Expression<G, K>> {
		readonly $path: K;
		readonly body: Slot<
			G,
			K,
			'body',
			| V.Element.Pair<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		// p only
		readonly clauses: Slot<G, K, 'clauses', V.Clause.Comprehension<G>>;
		// p only
	}
	export namespace Comprehension {
		export interface Generator<G extends GrammarMap, K extends Under<'expression.comprehension.generator'> = 'expression.comprehension.generator'> extends SubKindOf<V.Expression.Comprehension<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly body: Slot<
				G,
				K,
				'body',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
			>;
			readonly clauses: Slot<G, K, 'clauses', V.Clause.Comprehension<G>>;
		}
		export interface List<G extends GrammarMap, K extends Under<'expression.comprehension.list'> = 'expression.comprehension.list'> extends SubKindOf<V.Expression.Comprehension<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly body: Slot<
				G,
				K,
				'body',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
			>;
			readonly clauses: Slot<G, K, 'clauses', V.Clause.Comprehension<G>>;
		}
		export interface Map<G extends GrammarMap, K extends Under<'expression.comprehension.map'> = 'expression.comprehension.map'> extends SubKindOf<V.Expression.Comprehension<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly body: Slot<G, K, 'body', V.Element.Pair<G>>;
			readonly clauses: Slot<G, K, 'clauses', V.Clause.Comprehension<G>>;
		}
		export interface Set<G extends GrammarMap, K extends Under<'expression.comprehension.set'> = 'expression.comprehension.set'> extends SubKindOf<V.Expression.Comprehension<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly body: Slot<
				G,
				K,
				'body',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
			>;
			readonly clauses: Slot<G, K, 'clauses', V.Clause.Comprehension<G>>;
		}
	}
}
