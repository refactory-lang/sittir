import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export namespace Loop {
		export interface DoWhile<G extends GrammarMap, K extends Under<'statement.loop.do_while'> = 'statement.loop.do_while'> extends SubKindOf<V.Statement.Loop<G, K>, 'statements'> {
			// claimed by t
			readonly $path: K;
			readonly statements?: Slot<
				G,
				K,
				'statements',
				| V.Attribute.Any<G>
				| V.Declaration.Any<G>
				| V.Expression.Call.Macro<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Rest<G>
				| V.Statement.Any<G>
			>[];
			readonly condition: Slot<G, K, 'condition', V.Expression.Parenthesized<G>>;
		}
	}
}
