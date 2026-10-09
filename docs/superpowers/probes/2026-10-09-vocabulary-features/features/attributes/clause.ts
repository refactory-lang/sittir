import type { GrammarContext } from '../../context.ts';
export namespace Clause {
	export namespace Match {
		export namespace Arm {
			export interface Last<G extends GrammarContext> {
				readonly attributes?: G['attribute'][];
			}
		}
	}
}
