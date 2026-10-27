import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export namespace Case {
		export interface Match<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Case<G>> {
			// claimed by pr
			readonly $kind: 'clause.case.match';
			readonly body: G['slots']['clause.case.match']['body'];
			readonly guard?: G['slots']['clause.case.match']['guard'];
			readonly pattern: G['pattern'];
		}
	}
	export interface Let<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by r
		readonly $kind: 'clause.let';
		readonly pattern?: G['slots']['clause.let']['pattern'];
		readonly value?: G['slots']['clause.let']['value'];
	}
	export namespace Let {
		export interface Chain<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Let<G>> {
			// claimed by r
			readonly $kind: 'clause.let.chain';
			readonly left: G['slots']['clause.let.chain']['left'];
			readonly rights?: G['slots']['clause.let.chain']['rights'][];
		}
	}
}
