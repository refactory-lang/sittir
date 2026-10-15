import type { GrammarContext } from '../../context.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Call {
		export interface Template<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Call<G>> {
			// claimed by t
			readonly $kind: 'expression.call.template';
			readonly arguments: V.Literal.String.Interpolated<G>;
			readonly function: G['slots']['expression.call.template']['function'];
		}
	}
	export interface Interpolation<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by pt
		readonly $kind: 'expression.interpolation';
		readonly debug?: Flag;
		// p only
		readonly expression?: G['slots']['expression.interpolation']['expression'];
		readonly formatSpecifier?: V.Expression.Interpolation.Format<G>;
		// p only
		readonly typeConversion?: V.Expression.Interpolation.Conversion<G>;
		// p only
	}
	export namespace Interpolation {
		export interface Conversion<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Interpolation<G>> {
			// claimed by p
			readonly $kind: 'expression.interpolation.conversion';
		}
		export interface Format<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Interpolation<G>> {
			// claimed by p
			readonly $kind: 'expression.interpolation.format';
			readonly elements?: G['slots']['expression.interpolation.format']['elements'][];
		}
	}
}
