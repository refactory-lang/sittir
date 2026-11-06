import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export namespace Loop {
		export interface DoWhile<G extends GrammarMap, K extends Under<'statement.loop.do_while'> = 'statement.loop.do_while'> extends SubKindOf<V.Statement.Loop<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly body: Slot<G, K, 'body', V.Declaration.Any<G> | V.Statement.Any<G>>;
			readonly condition: Slot<G, K, 'condition', V.Expression.Parenthesized<G>>;
		}
	}
}
