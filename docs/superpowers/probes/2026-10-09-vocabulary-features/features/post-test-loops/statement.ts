import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export namespace Loop {
		export interface DoWhile<G extends GrammarContext> extends SubKindOf<V.Statement.Loop<G>> {
			readonly $kind: 'statement.loop.do_while';
			readonly body: G['slots']['statement.loop.do_while']['body'];
			readonly condition: V.Expression.Parenthesized<G>;
		}
	}
}
