import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export namespace Loop {
		export interface Counted<G extends GrammarMap, K extends Under<'statement.loop.counted'> = 'statement.loop.counted'> extends SubKindOf<V.Statement.Loop<G, K>, 'body'> {
			// claimed by t
			readonly $kind: K;
			readonly body: Slot<G, 'statement.loop.counted', 'body', V.Declaration.Any<G> | V.Statement.Any<G>>;
			readonly condition: Slot<
				G,
				'statement.loop.counted',
				'condition',
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Empty<G>
			>;
			readonly increment?: Slot<
				G,
				'statement.loop.counted',
				'increment',
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
			readonly initializer: Slot<
				G,
				'statement.loop.counted',
				'initializer',
				| V.Declaration.Any<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Empty<G>
			>;
		}
	}
}
