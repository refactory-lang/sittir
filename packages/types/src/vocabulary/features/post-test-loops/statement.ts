import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export namespace Loop {
		export interface DoWhile<G extends GrammarMap, K extends Under<'statement.loop.do_while'> = 'statement.loop.do_while'> extends SubKindOf<V.Statement.Loop<G, K>, 'body'> {
			// claimed by t
			readonly $kind: K;
			readonly body: Slot<G, 'statement.loop.do_while', 'body', V.Declaration.Any<G> | V.Statement.Any<G>>;
			readonly condition: V.Expression.Parenthesized<G>;
		}
	}
}
