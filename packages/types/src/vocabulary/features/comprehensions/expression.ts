import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Comprehension<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.comprehension';
		readonly body: Slot<
			G,
			'expression.comprehension',
			'body',
			| V.Element.Pair<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		// p only
		readonly clauses: V.Clause.Comprehension<G>;
		// p only
	}
	export namespace Comprehension {
		export interface Generator<G extends GrammarMap> extends SubKindOf<V.Expression.Comprehension<G>, 'body'> {
			// claimed by p
			readonly $kind: 'expression.comprehension.generator';
			readonly body: Slot<
				G,
				'expression.comprehension.generator',
				'body',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
			>;
			readonly clauses: V.Clause.Comprehension<G>;
		}
		export interface List<G extends GrammarMap> extends SubKindOf<V.Expression.Comprehension<G>, 'body'> {
			// claimed by p
			readonly $kind: 'expression.comprehension.list';
			readonly body: Slot<
				G,
				'expression.comprehension.list',
				'body',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
			>;
			readonly clauses: V.Clause.Comprehension<G>;
		}
		export interface Map<G extends GrammarMap> extends SubKindOf<V.Expression.Comprehension<G>, 'body'> {
			// claimed by p
			readonly $kind: 'expression.comprehension.map';
			readonly body: V.Element.Pair<G>;
			readonly clauses: V.Clause.Comprehension<G>;
		}
		export interface Set<G extends GrammarMap> extends SubKindOf<V.Expression.Comprehension<G>, 'body'> {
			// claimed by p
			readonly $kind: 'expression.comprehension.set';
			readonly body: Slot<
				G,
				'expression.comprehension.set',
				'body',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
			>;
			readonly clauses: V.Clause.Comprehension<G>;
		}
	}
}
