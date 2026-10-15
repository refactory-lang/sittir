import type { GrammarContext } from '../../../../context.ts';
import type { Flag } from '../../../../utils.ts';
export namespace Type {
	export namespace Function {
		export interface Constructor<G extends GrammarContext<G>> {
			readonly abstract?: Flag;
		}
	}
}
