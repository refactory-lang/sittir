import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Assignment {
		export namespace Compound {
			export interface Exponent<G extends GrammarMap, K extends Under<'expression.assignment.compound.exponent'> = 'expression.assignment.compound.exponent'> extends SubKindOf<V.Expression.Assignment.Compound<G, K>> {
				readonly $path: K;
			}
		}
	}
	export namespace Binary {
		export namespace Arithmetic {
			export interface Exponent<G extends GrammarMap, K extends Under<'expression.binary.arithmetic.exponent'> = 'expression.binary.arithmetic.exponent'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
		}
		export interface Membership<G extends GrammarMap, K extends Under<'expression.binary.membership'> = 'expression.binary.membership'> extends SubKindOf<V.Expression.Binary<G, K>, 'left' | 'operator'> {
			readonly $path: K;
			readonly left: Slot<G, K, 'left', V.Expression.Any<G>>;
			// p only
			readonly operator?: Slot<G, K, 'operator', unknown>;
			// p only
		}
		export namespace Membership {
			export interface In<G extends GrammarMap, K extends Under<'expression.binary.membership.in'> = 'expression.binary.membership.in'> extends SubKindOf<V.Expression.Binary<G, K>, 'operator'> {
				readonly $path: K;
				readonly operator?: never;
			}
		}
	}
}
