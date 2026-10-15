import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Cast<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.cast';
		readonly expression?: G['slots']['expression.cast']['expression'];
		// t only
	}
	export namespace Cast {
		export interface Assertion<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Cast<G>> {
			// claimed by t
			readonly $kind: 'expression.cast.assertion';
			readonly expression: G['slots']['expression.cast.assertion']['expression'];
			readonly type: G['slots']['expression.cast.assertion']['type'];
		}
		export namespace Assertion {
			export interface AngleBracket<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Cast.Assertion<G>> {
				// claimed by t
				readonly $kind: 'expression.cast.assertion.angle_bracket';
			}
		}
		export interface Conversion<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Cast<G>> {
			// claimed by r
			readonly $kind: 'expression.cast.conversion';
			readonly expression: G['slots']['expression.cast.conversion']['expression'];
			readonly type: G['slots']['expression.cast.conversion']['type'];
		}
		export interface Satisfies<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Cast<G>> {
			// claimed by t
			readonly $kind: 'expression.cast.satisfies';
			readonly expression: G['slots']['expression.cast.satisfies']['expression'];
			readonly type: G['slots']['expression.cast.satisfies']['type'];
		}
	}
	export interface Function<G extends GrammarContext<G>> {
		readonly returnType?: G['slots']['expression.function']['returnType'];
	}
}
