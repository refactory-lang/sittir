import type { GrammarContext } from '../../../../context.ts';
export namespace Type {
	export namespace Function {
		export interface Constructor<G extends GrammarContext> {
			readonly abstract?: boolean;
		}
	}
}
