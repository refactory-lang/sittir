import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export namespace Interpolation {
		export interface Conversion<G extends GrammarMap, K extends Under<'expression.interpolation.conversion'> = 'expression.interpolation.conversion'> extends SubKindOf<V.Expression.Interpolation<G, K>> {
			// claimed by p
			readonly $path: K;
		}
		export interface Format<G extends GrammarMap, K extends Under<'expression.interpolation.format'> = 'expression.interpolation.format'> extends SubKindOf<V.Expression.Interpolation<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly elements?: Slot<G, K, 'elements', V.Expression.Interpolation<G> | string>[];
		}
	}
}
