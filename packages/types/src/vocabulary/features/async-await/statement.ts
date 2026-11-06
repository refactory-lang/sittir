import type { GrammarMap } from '../../map.ts';
import type { Flag } from '../../utils.ts';
export namespace Statement {
	export namespace Loop {
		export interface ForEach<G extends GrammarMap> {
			readonly async?: Flag;
			// pt only
		}
	}
	export interface Resource<G extends GrammarMap> {
		readonly async?: Flag;
	}
}
