import type { GrammarMap } from '../../map.ts';
import type { Flag } from '../../utils.ts';
export namespace Declaration {
	export namespace Parameter {
		export interface Receiver<G extends GrammarMap> {
			readonly reference?: boolean;
			// r only
		}
	}
	export interface Variable<G extends GrammarMap> {
		readonly byReference?: Flag;
		// r only
	}
}
