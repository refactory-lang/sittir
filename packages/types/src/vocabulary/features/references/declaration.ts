import type { GrammarContext } from '../../context.ts';
export namespace Declaration {
	export namespace Parameter {
		export interface Self<G extends GrammarContext<G>> {
			readonly reference?: boolean;
		}
	}
}
