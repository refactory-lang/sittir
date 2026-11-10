import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export namespace Cast {
		export interface Assertion<G extends GrammarMap, K extends Under<'expression.cast.assertion'> = 'expression.cast.assertion'> extends SubKindOf<V.Expression.Cast<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly expression: Slot<
				G,
				K,
				'expression',
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
			readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | string | V.Type.Any<G>>;
		}
		export namespace Assertion {
			export interface AngleBracket<G extends GrammarMap, K extends Under<'expression.cast.assertion.angle_bracket'> = 'expression.cast.assertion.angle_bracket'> extends SubKindOf<V.Expression.Cast.Assertion<G, K>> {
				// claimed by t
				readonly $path: K;
			}
		}
		export interface Satisfies<G extends GrammarMap, K extends Under<'expression.cast.satisfies'> = 'expression.cast.satisfies'> extends SubKindOf<V.Expression.Cast<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly expression: Slot<
				G,
				K,
				'expression',
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
			readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
	}
	export interface Function<G extends GrammarMap, K extends Under<'expression.function'> = 'expression.function'> {
		readonly returnType?: Slot<G, K, 'returnType', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
}
