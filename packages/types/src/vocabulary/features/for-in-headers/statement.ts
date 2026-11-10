import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
export namespace Statement {
	export namespace Loop {
		export interface ForEach<G extends GrammarMap, K extends Under<'statement.loop.for_each'> = 'statement.loop.for_each'> {
			readonly header?: Slot<G, K, 'header', unknown>;
			// t only
		}
	}
}
