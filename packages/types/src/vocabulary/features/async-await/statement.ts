import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Statement {
	export namespace Loop {
		export interface ForEach<G extends GrammarContext<G>> {
			readonly async?: Flag;
			// pt only
		}
	}
	export interface Resource<G extends GrammarContext<G>> {
		readonly async?: Flag;
	}
}
