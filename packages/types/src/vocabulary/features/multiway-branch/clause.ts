import type { GrammarContext } from '../../context.ts';
export namespace Clause {
	export interface Case<G extends GrammarContext<G>> {
		readonly value?: G['slots']['clause.case']['value'];
		readonly bodies?: G['slots']['clause.case']['bodies'][];
	}
	export namespace Case {
		export interface Default<G extends GrammarContext<G>> {
			readonly bodies?: G['slots']['clause.case.default']['bodies'][];
		}
	}
}
