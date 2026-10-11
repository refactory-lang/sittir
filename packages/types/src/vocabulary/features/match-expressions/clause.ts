import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Case<G extends GrammarContext<G>> {
		readonly casePatterns?: V.Pattern.Case<G>[];
		// p only
		readonly consequence?: G['slots']['clause.case']['consequence'];
		// p only
		readonly guard?: V.Clause.Comprehension.If<G>;
		// p only
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
	export interface Match<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.match';
	}
	export namespace Match {
		export interface Arm<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Match<G>> {
			// claimed by r
			readonly $kind: 'clause.match.arm';
			readonly pattern: V.Pattern.Match<G>;
			readonly value: G['slots']['clause.match.arm']['value'];
		}
		export namespace Arm {
			export interface Last<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Match.Arm<G>> {
				// claimed by r
				readonly $kind: 'clause.match.arm.last';
				readonly comma?: boolean;
				readonly pattern: V.Pattern.Match<G>;
				readonly value: G['slots']['clause.match.arm.last']['value'];
			}
		}
	}
}
