import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Cast<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.cast';
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
		export interface Assertion<G extends GrammarMap> extends SubKindOf<V.Expression.Cast<G>, 'expression'> {
			// claimed by t
			readonly $kind: 'expression.cast.assertion';
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
			export interface AngleBracket<G extends GrammarMap> extends SubKindOf<V.Expression.Cast.Assertion<G>> {
				// claimed by t
				readonly $kind: 'expression.cast.assertion.angle_bracket';
			}
		}
		export interface Conversion<G extends GrammarMap> extends SubKindOf<V.Expression.Cast<G>, 'expression'> {
			// claimed by r
			readonly $kind: 'expression.cast.conversion';
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
		export interface Satisfies<G extends GrammarMap> extends SubKindOf<V.Expression.Cast<G>, 'expression'> {
			// claimed by t
			readonly $kind: 'expression.cast.satisfies';
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
	export interface Function<G extends GrammarMap> {
		readonly returnType?: Slot<G, 'expression.function', 'returnType', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
}
