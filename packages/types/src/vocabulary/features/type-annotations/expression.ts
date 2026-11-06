import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Cast<G extends GrammarMap, K extends Under<'expression.cast'> = 'expression.cast'> extends SubKindOf<V.Expression<G, K>> {
		readonly $kind: K;
		readonly expression?: Slot<
			G,
			'expression.cast',
			'expression',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
		>;
		// t only
	}
	export namespace Cast {
		export interface Assertion<G extends GrammarMap, K extends Under<'expression.cast.assertion'> = 'expression.cast.assertion'> extends SubKindOf<V.Expression.Cast<G, K>, 'expression'> {
			// claimed by t
			readonly $kind: K;
			readonly expression: Slot<
				G,
				'expression.cast.assertion',
				'expression',
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
			readonly type: Slot<G, 'expression.cast.assertion', 'type', V.Identifier.Any<G> | string | V.Type.Any<G>>;
		}
		export namespace Assertion {
			export interface AngleBracket<G extends GrammarMap, K extends Under<'expression.cast.assertion.angle_bracket'> = 'expression.cast.assertion.angle_bracket'> extends SubKindOf<V.Expression.Cast.Assertion<G, K>> {
				// claimed by t
				readonly $kind: K;
			}
		}
		export interface Conversion<G extends GrammarMap, K extends Under<'expression.cast.conversion'> = 'expression.cast.conversion'> extends SubKindOf<V.Expression.Cast<G, K>, 'expression'> {
			// claimed by r
			readonly $kind: K;
			readonly expression: Slot<
				G,
				'expression.cast.conversion',
				'expression',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
			>;
			readonly type: Slot<
				G,
				'expression.cast.conversion',
				'type',
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Type.Any<G>
			>;
		}
		export interface Satisfies<G extends GrammarMap, K extends Under<'expression.cast.satisfies'> = 'expression.cast.satisfies'> extends SubKindOf<V.Expression.Cast<G, K>, 'expression'> {
			// claimed by t
			readonly $kind: K;
			readonly expression: Slot<
				G,
				'expression.cast.satisfies',
				'expression',
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
			readonly type: Slot<G, 'expression.cast.satisfies', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
	}
	export interface Function<G extends GrammarMap, K extends Under<'expression.function'> = 'expression.function'> {
		readonly returnType?: Slot<G, 'expression.function', 'returnType', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
}
