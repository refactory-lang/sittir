import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export namespace Case {
		export interface Match<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Case<G>> {
			// claimed by p
			readonly $kind: 'clause.case.match';
			readonly casePatterns: V.Pattern.Case<G>[];
			readonly consequence: G['slots']['clause.case.match']['consequence'];
			readonly guard?: V.Clause.Comprehension.If<G>;
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
	export interface Match<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.match';
	}
	export namespace Match {
		export interface Arm<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Match<G>> {
			// claimed by r
			readonly $kind: 'clause.match.arm';
			readonly match: V.Pattern.Match<G>;
			readonly value: G['slots']['clause.match.arm']['value'];
		}
		export namespace Arm {
			export interface Last<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Match.Arm<G>> {
				// claimed by r
				readonly $kind: 'clause.match.arm.last';
				readonly trailingComma?: boolean;
				readonly match: V.Pattern.Match<G>;
				readonly value: G['slots']['clause.match.arm.last']['value'];
			}
		}
	}
}
