import type { GrammarContext } from '../../context.ts';
export namespace Clause {
	export namespace Case {
		export interface Match<G extends GrammarContext<G>> {
			readonly attributes?: G['attribute'][];
		}
	}
}
