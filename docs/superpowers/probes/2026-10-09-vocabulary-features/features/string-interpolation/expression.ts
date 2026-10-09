import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Interpolation<G extends GrammarContext> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.interpolation';
		readonly debug?: boolean;
		readonly expression?: G['slots']['expression.interpolation']['expression'];
		readonly formatSpecifier?: V.Expression.Interpolation.Format<G>;
		readonly typeConversion?: V.Expression.Interpolation.Conversion<G>;
	}
	export namespace Interpolation {
		export interface Conversion<G extends GrammarContext> extends SubKindOf<V.Expression.Interpolation<G>> {
			readonly $kind: 'expression.interpolation.conversion';
		}
		export interface Format<G extends GrammarContext> extends SubKindOf<V.Expression.Interpolation<G>> {
			readonly $kind: 'expression.interpolation.format';
			readonly elements?: G['slots']['expression.interpolation.format']['elements'][];
		}
	}
}
