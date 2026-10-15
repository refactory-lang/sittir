import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export namespace Case {
		export interface Default<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Case<G>> {
			// claimed by t
			readonly $kind: 'clause.case.default';
			readonly bodies?: G['slots']['clause.case.default']['bodies'][];
		}
		export interface Switch<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Case<G>> {
			// claimed by t
			readonly $kind: 'clause.case.switch';
			readonly bodies?: G['slots']['clause.case.switch']['bodies'][];
			readonly value: G['slots']['clause.case.switch']['value'];
		}
	}
}
