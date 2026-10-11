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
		export interface As<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Cast<G>> {
			// claimed by rt
			readonly $kind: 'expression.cast.as';
			readonly expression?: G['slots']['expression.cast.as']['expression'];
			// t only
			readonly type?: G['slots']['expression.cast.as']['type'];
			// r only
			readonly typeAnnotation?: G['slots']['expression.cast.as']['typeAnnotation'];
			// t only
			readonly value?: G['slots']['expression.cast.as']['value'];
			// r only
		}
		export interface Assertion<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Cast<G>> {
			// claimed by t
			readonly $kind: 'expression.cast.assertion';
			readonly expression: G['slots']['expression.cast.assertion']['expression'];
			readonly typeArguments: G['slots']['expression.cast.assertion']['typeArguments'][];
		}
		export interface Satisfies<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Cast<G>> {
			// claimed by t
			readonly $kind: 'expression.cast.satisfies';
			readonly expression: G['slots']['expression.cast.satisfies']['expression'];
			readonly typeAnnotation: G['slots']['expression.cast.satisfies']['typeAnnotation'];
		}
	}
	export interface Function<G extends GrammarContext<G>> {
		readonly returnType?: G['slots']['expression.function']['returnType'];
	}
}
