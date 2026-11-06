import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export namespace Call {
		export interface Construct<G extends GrammarMap, K extends Under<'expression.call.construct'> = 'expression.call.construct'> extends SubKindOf<V.Expression.Call<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly arguments?: Slot<
				G,
				K,
				'arguments',
				| V.Declaration.Module<G>
				| V.Element.Spread<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>[];
			readonly function: Slot<
				G,
				K,
				'function',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
		}
		export namespace Construct {
			export interface Bare<G extends GrammarMap, K extends Under<'expression.call.construct.bare'> = 'expression.call.construct.bare'> extends SubKindOf<V.Expression.Call.Construct<G, K>> {
				// claimed by t
				readonly $kind: K;
				readonly arguments?: never;
			}
		}
	}
	export interface Class<G extends GrammarMap, K extends Under<'expression.class'> = 'expression.class'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly body: Slot<G, K, 'body', V.Declaration.Any<G> | V.Statement.Block.Static<G> | string>[];
		readonly name?: Slot<G, K, 'name', V.Identifier.Any<G>>;
	}
}
