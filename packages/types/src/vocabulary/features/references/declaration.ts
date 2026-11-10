import type { GrammarMap } from '../../map.ts';
import type { Flag, Under } from '../../utils.ts';
export namespace Declaration {
	export namespace Parameter {
		export interface Receiver<G extends GrammarMap, K extends Under<'declaration.parameter.receiver'> = 'declaration.parameter.receiver'> {
			readonly reference?: boolean;
			// r only
		}
	}
	export interface Variable<G extends GrammarMap, K extends Under<'declaration.variable'> = 'declaration.variable'> {
		readonly byReference?: Flag;
		// r only
	}
}
