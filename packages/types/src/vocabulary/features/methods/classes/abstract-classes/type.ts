import type { GrammarMap } from '../../../../map.ts';
import type { Flag } from '../../../../utils.ts';
export namespace Type {
	export namespace Function {
		export interface Constructor<G extends GrammarMap> {
			readonly abstract?: Flag;
		}
	}
}
