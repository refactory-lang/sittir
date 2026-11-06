import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Call {
		export interface Template<G extends GrammarMap, K extends Under<'expression.call.template'> = 'expression.call.template'> extends SubKindOf<V.Expression.Call<G, K>, 'arguments' | 'function'> {
			// claimed by t
			readonly $kind: K;
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
	export interface Interpolation<G extends GrammarMap, K extends Under<'expression.interpolation'> = 'expression.interpolation'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by pt
		readonly $kind: K;
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
		export interface Conversion<G extends GrammarMap, K extends Under<'expression.interpolation.conversion'> = 'expression.interpolation.conversion'> extends SubKindOf<V.Expression.Interpolation<G, K>> {
			// claimed by p
			readonly $kind: K;
		}
		export interface Format<G extends GrammarMap, K extends Under<'expression.interpolation.format'> = 'expression.interpolation.format'> extends SubKindOf<V.Expression.Interpolation<G, K>> {
			// claimed by p
			readonly $kind: K;
			readonly elements?: Slot<G, 'expression.interpolation.format', 'elements', V.Expression.Interpolation<G> | string>[];
		}
	}
}
