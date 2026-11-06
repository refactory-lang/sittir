import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Delete<G extends GrammarMap, K extends Under<'statement.delete'> = 'statement.delete'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by p
		readonly $path: K;
		readonly expressions: Slot<
			G,
			K,
			'expressions',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
	}
	export interface If<G extends GrammarMap, K extends Under<'statement.if'> = 'statement.if'> {
		readonly alternatives?: Slot<G, K, 'alternatives', V.Clause.Any<G>>[];
		// p only
	}
	export namespace Loop {
		export interface ForEach<G extends GrammarMap, K extends Under<'statement.loop.for_each'> = 'statement.loop.for_each'> {
			readonly alternative?: Slot<G, K, 'alternative', V.Clause.Else<G>>;
			// p only
		}
		export interface While<G extends GrammarMap, K extends Under<'statement.loop.while'> = 'statement.loop.while'> {
			readonly alternative?: Slot<G, K, 'alternative', V.Clause.Else<G>>;
			// p only
		}
	}
}
