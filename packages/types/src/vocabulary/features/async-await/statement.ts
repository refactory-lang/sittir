import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Statement {
	export namespace Loop {
		export interface For<G extends GrammarContext<G>> {
			readonly async?: Flag;
			// pt only
		}
	}
	export interface With<G extends GrammarContext<G>> {
		readonly async?: Flag;
	}
}
