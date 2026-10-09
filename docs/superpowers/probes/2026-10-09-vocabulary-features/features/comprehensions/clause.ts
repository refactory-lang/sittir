import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Comprehension<G extends GrammarContext> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.comprehension';
		readonly contents?: V.Clause.Comprehension.Any<G>[];
	}
	export namespace Comprehension {
		export interface For<G extends GrammarContext> extends SubKindOf<V.Clause.Comprehension<G>> {
			readonly $kind: 'clause.comprehension.for';
			readonly comma?: boolean;
			readonly left: G['slots']['clause.comprehension.for']['left'];
			readonly rights: G['slots']['clause.comprehension.for']['rights'][];
		}
		export interface If<G extends GrammarContext> extends SubKindOf<V.Clause.Comprehension<G>> {
			readonly $kind: 'clause.comprehension.if';
			readonly condition: G['slots']['clause.comprehension.if']['condition'];
		}
	}
}
