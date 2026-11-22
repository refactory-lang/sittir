import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Binary {
		export interface Identity<G extends GrammarMap, K extends Under<'expression.binary.identity'> = 'expression.binary.identity'> extends SubKindOf<V.Expression.Binary<G, K>, 'left' | 'operator'> {
			readonly $path: K;
			readonly left: Slot<G, K, 'left', V.Expression.Any<G>>;
			// p only
			readonly operator?: Slot<G, K, 'operator', unknown>;
			// p only
		}
		export namespace Identity {
			export interface Is<G extends GrammarMap, K extends Under<'expression.binary.identity.is'> = 'expression.binary.identity.is'> extends SubKindOf<V.Expression.Binary.Identity<G, K>, 'left' | 'operator'> {
				// claimed by p
				readonly $path: K;
				readonly left: Slot<G, K, 'left', V.Expression.Any<G>>;
				readonly operator?: Slot<G, K, 'operator', unknown>;
			}
			export interface IsNot<G extends GrammarMap, K extends Under<'expression.binary.identity.is_not'> = 'expression.binary.identity.is_not'> extends SubKindOf<V.Expression.Binary.Identity<G, K>, 'left' | 'operator'> {
				// claimed by p
				readonly $path: K;
				readonly left: Slot<G, K, 'left', V.Expression.Any<G>>;
				readonly operator?: Slot<G, K, 'operator', unknown>;
			}
		}
	}
}
