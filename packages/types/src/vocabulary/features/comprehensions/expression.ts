import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Comprehension<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.comprehension';
		readonly body: G['slots']['expression.comprehension']['body'];
		// p only
		readonly clauses: V.Clause.Comprehension<G>;
		// p only
	}
	export namespace Comprehension {
		export interface Generator<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Comprehension<G>> {
			// claimed by p
			readonly $kind: 'expression.comprehension.generator';
			readonly body: G['slots']['expression.comprehension.generator']['body'];
			readonly clauses: V.Clause.Comprehension<G>;
		}
		export interface List<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Comprehension<G>> {
			// claimed by p
			readonly $kind: 'expression.comprehension.list';
			readonly body: G['slots']['expression.comprehension.list']['body'];
			readonly clauses: V.Clause.Comprehension<G>;
		}
		export interface Map<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Comprehension<G>> {
			// claimed by p
			readonly $kind: 'expression.comprehension.map';
			readonly body: V.Element.Pair<G>;
			readonly clauses: V.Clause.Comprehension<G>;
		}
		export interface Set<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Comprehension<G>> {
			// claimed by p
			readonly $kind: 'expression.comprehension.set';
			readonly body: G['slots']['expression.comprehension.set']['body'];
			readonly clauses: V.Clause.Comprehension<G>;
		}
	}
}
