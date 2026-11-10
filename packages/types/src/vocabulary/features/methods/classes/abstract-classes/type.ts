import type { GrammarMap } from '../../../../map.ts';
import type { Flag, Under } from '../../../../utils.ts';
export namespace Type {
	export namespace Function {
		export interface Constructor<G extends GrammarMap, K extends Under<'type.function.constructor'> = 'type.function.constructor'> {
			readonly abstract?: Flag;
		}
	}
}
