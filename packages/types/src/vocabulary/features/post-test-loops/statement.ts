import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export namespace Loop {
		export interface DoWhile<G extends GrammarMap> extends SubKindOf<V.Statement.Loop<G>, 'body'> {
			// claimed by t
			readonly $kind: 'statement.loop.do_while';
			readonly body: Slot<G, 'statement.loop.do_while', 'body', V.Declaration.Any<G> | V.Statement.Any<G>>;
			readonly condition: V.Expression.Parenthesized<G>;
		}
	}
}
