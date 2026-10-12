import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Declaration {
	export namespace Parameter {
		export interface Self<G extends GrammarContext<G>> {
			readonly reference?: boolean;
			// r only
		}
	}
	export namespace Variable {
		export interface Static<G extends GrammarContext<G>> {
			readonly byReference?: Flag;
		}
	}
}
