import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Expression<G extends GrammarMap, K extends Under<'statement.expression'> = 'statement.expression'> {
		readonly content?: Slot<
			G,
			K,
			'content',
			| V.Declaration.Variable<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
			| V.Declaration.Constant<G>
		> | Slot<
			G,
			K,
			'content',
			| V.Declaration.Variable<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
			| V.Declaration.Constant<G>
		>[];
		// pr only
	}
	export namespace Loop {
		export interface ForEach<G extends GrammarMap, K extends Under<'statement.loop.for_each'> = 'statement.loop.for_each'> {
			readonly left?: Slot<G, K, 'left', unknown>;
			// pr only
			readonly right?: Slot<
				G,
				K,
				'right',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
				| V.Statement.Any<G>
			>;
			// pr only
		}
	}
}
