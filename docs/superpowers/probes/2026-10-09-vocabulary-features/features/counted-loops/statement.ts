import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export namespace Loop {
		export interface Counted<G extends GrammarContext> extends SubKindOf<V.Statement.Loop<G>> {
			readonly $kind: 'statement.loop.counted';
			readonly body: G['slots']['statement.loop.counted']['body'];
			readonly condition: G['slots']['statement.loop.counted']['condition'];
			readonly increment?: G['slots']['statement.loop.counted']['increment'];
			readonly initializer: G['slots']['statement.loop.counted']['initializer'];
		}
	}
}
