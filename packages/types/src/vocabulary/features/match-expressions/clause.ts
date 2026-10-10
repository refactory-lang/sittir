import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Case<G extends GrammarContext<G>> {
		readonly casePatterns?: V.Pattern.Case<G>[];
		readonly guard?: V.Clause.Comprehension.If<G>;
		readonly consequence?: G['slots']['clause.case']['consequence'];
	}
	export interface Let<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.let';
		readonly pattern?: G['slots']['clause.let']['pattern'];
		readonly value?: G['slots']['clause.let']['value'];
	}
	export namespace Let {
		export interface Chain<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Let<G>> {
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
			readonly $kind: 'clause.match.arm';
		}
		export namespace Arm {
			export interface Last<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Match.Arm<G>> {
				readonly $kind: 'clause.match.arm.last';
				readonly comma?: boolean;
				readonly pattern: V.Pattern.Match<G>;
				readonly value: G['slots']['clause.match.arm.last']['value'];
			}
		}
	}
}
