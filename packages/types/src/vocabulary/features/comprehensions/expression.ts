import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Comprehension<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.comprehension';
		readonly body: G['slots']['expression.comprehension']['body'];
		readonly comprehensionClauses: V.Clause.Comprehension<G>;
	}
	export namespace Comprehension {
		export interface Dictionary<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Comprehension<G>> {
			readonly $kind: 'expression.comprehension.dictionary';
			readonly body: V.Element.Pair<G>;
			readonly comprehensionClauses: V.Clause.Comprehension<G>;
		}
		export interface Generator<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Comprehension<G>> {
			readonly $kind: 'expression.comprehension.generator';
			readonly body: G['slots']['expression.comprehension.generator']['body'];
			readonly comprehensionClauses: V.Clause.Comprehension<G>;
		}
		export interface List<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Comprehension<G>> {
			readonly $kind: 'expression.comprehension.list';
			readonly body: G['slots']['expression.comprehension.list']['body'];
			readonly comprehensionClauses: V.Clause.Comprehension<G>;
		}
		export interface Set<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Comprehension<G>> {
			readonly $kind: 'expression.comprehension.set';
			readonly body: G['slots']['expression.comprehension.set']['body'];
			readonly comprehensionClauses: V.Clause.Comprehension<G>;
		}
	}
}
