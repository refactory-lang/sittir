import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Call {
		export interface Template<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Call<G>> {
			readonly $kind: 'expression.call.template';
			readonly arguments: V.Literal.Template<G>;
			readonly function: G['slots']['expression.call.template']['function'];
		}
	}
	export interface Interpolation<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.interpolation';
		readonly debug?: boolean;
		readonly expression?: G['slots']['expression.interpolation']['expression'];
		readonly formatSpecifier?: V.Expression.Interpolation.Format<G>;
		readonly typeConversion?: V.Expression.Interpolation.Conversion<G>;
	}
	export namespace Interpolation {
		export interface Conversion<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Interpolation<G>> {
			readonly $kind: 'expression.interpolation.conversion';
		}
		export interface Format<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Interpolation<G>> {
			readonly $kind: 'expression.interpolation.format';
			readonly elements?: G['slots']['expression.interpolation.format']['elements'][];
		}
	}
}
