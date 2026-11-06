import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export namespace Call {
		export interface Construct<G extends GrammarMap> extends SubKindOf<V.Expression.Call<G>, 'arguments' | 'function' | 'typeArguments'> {
			// claimed by t
			readonly $kind: 'expression.call.construct';
			readonly arguments?: Slot<
				G,
				'expression.call.construct',
				'arguments',
				| V.Declaration.Module<G>
				| V.Element.Spread<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>[];
			readonly function: Slot<
				G,
				'expression.call.construct',
				'function',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
		}
		export namespace Construct {
			export interface Bare<G extends GrammarMap> extends SubKindOf<V.Expression.Call.Construct<G>> {
				// claimed by t
				readonly $kind: 'expression.call.construct.bare';
				readonly arguments?: never;
			}
		}
	}
	export interface Class<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by t
		readonly $kind: 'expression.class';
		readonly body: Slot<G, 'expression.class', 'body', V.Declaration.Any<G> | V.Statement.Block.Static<G> | string>[];
		readonly name?: V.Identifier<G>;
	}
}
