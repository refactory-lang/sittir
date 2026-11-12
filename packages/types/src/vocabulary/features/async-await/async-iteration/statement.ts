import type { GrammarMap } from '../../../map.ts';
import type { Flag, Under } from '../../../utils.ts';
export namespace Statement {
	export namespace Loop {
		export interface ForEach<G extends GrammarMap, K extends Under<'statement.loop.for_each'> = 'statement.loop.for_each'> {
			readonly async?: Flag;
			// pt only
		}
	}
}
