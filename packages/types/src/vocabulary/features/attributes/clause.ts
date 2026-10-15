import type { GrammarContext } from '../../context.ts';
export namespace Clause {
	export namespace Match {
		export interface Arm<G extends GrammarContext<G>> {
			readonly attributes?: G['attribute'][];
		}
		export namespace Arm {
			export interface Last<G extends GrammarContext<G>> {
				readonly attributes?: G['attribute'][];
			}
		}
	}
}
