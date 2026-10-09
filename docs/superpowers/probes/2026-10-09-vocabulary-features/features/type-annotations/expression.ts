import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Cast<G extends GrammarContext> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.cast';
		readonly expression?: G['slots']['expression.cast']['expression'];
	}
	export namespace Cast {
		export interface As<G extends GrammarContext> extends SubKindOf<V.Expression.Cast<G>> {
			readonly $kind: 'expression.cast.as';
			readonly expression?: G['slots']['expression.cast.as']['expression'];
			readonly type?: G['slots']['expression.cast.as']['type'];
			readonly typeAnnotation?: G['slots']['expression.cast.as']['typeAnnotation'];
			readonly value?: G['slots']['expression.cast.as']['value'];
		}
		export interface Assertion<G extends GrammarContext> extends SubKindOf<V.Expression.Cast<G>> {
			readonly $kind: 'expression.cast.assertion';
			readonly expression: G['slots']['expression.cast.assertion']['expression'];
			readonly typeArguments: G['slots']['expression.cast.assertion']['typeArguments'][];
		}
		export interface Satisfies<G extends GrammarContext> extends SubKindOf<V.Expression.Cast<G>> {
			readonly $kind: 'expression.cast.satisfies';
			readonly expression: G['slots']['expression.cast.satisfies']['expression'];
			readonly typeAnnotation: G['slots']['expression.cast.satisfies']['typeAnnotation'];
		}
	}
	export interface Function<G extends GrammarContext> {
		readonly returnType?: G['slots']['expression.function']['returnType'];
	}
	export namespace Function {
		export interface Generator<G extends GrammarContext> {
			readonly returnType?: G['slots']['expression.function.generator']['returnType'];
		}
	}
}
