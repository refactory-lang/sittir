import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export namespace Loop {
		export interface ForEach<G extends GrammarMap, K extends Under<'statement.loop.for_each'> = 'statement.loop.for_each'> {
			readonly left?: Slot<G, K, 'left', V.Pattern.Any<G>>;
			// pr only
			readonly right?: Slot<G, K, 'right', V.Expression.Any<G>>;
			// pr only
		}
	}
}
