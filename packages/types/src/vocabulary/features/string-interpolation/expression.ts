import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Call {
		export interface Template<G extends GrammarMap> extends SubKindOf<V.Expression.Call<G>, 'arguments' | 'function'> {
			// claimed by t
			readonly $kind: 'expression.call.template';
			readonly arguments: V.Literal.String.Interpolated<G>;
			readonly function: Slot<
				G,
				'expression.call.template',
				'function',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
		}
	}
	export interface Interpolation<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by pt
		readonly $kind: 'expression.interpolation';
		readonly debug?: Flag;
		// p only
		readonly expression?: Slot<
			G,
			'expression.interpolation',
			'expression',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		readonly formatSpecifier?: V.Expression.Interpolation.Format<G>;
		// p only
		readonly typeConversion?: V.Expression.Interpolation.Conversion<G>;
		// p only
	}
	export namespace Interpolation {
		export interface Conversion<G extends GrammarMap> extends SubKindOf<V.Expression.Interpolation<G>> {
			// claimed by p
			readonly $kind: 'expression.interpolation.conversion';
		}
		export interface Format<G extends GrammarMap> extends SubKindOf<V.Expression.Interpolation<G>> {
			// claimed by p
			readonly $kind: 'expression.interpolation.format';
			readonly elements?: Slot<G, 'expression.interpolation.format', 'elements', V.Expression.Interpolation<G> | string>[];
		}
	}
}
