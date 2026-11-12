import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Binary {
		// @ts-expect-error expression.binary.identity: its operator fill is unknown, outside expression.binary's string.
		export interface Identity<G extends GrammarMap, K extends Under<'expression.binary.identity'> = 'expression.binary.identity'> extends SubKindOf<V.Expression.Binary<G, K>> {
			readonly $path: K;
			readonly left: Slot<
				G,
				K,
				'left',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Rest<G>
			>;
			// p only
			readonly operator?: Slot<G, K, 'operator', unknown>;
			// p only
		}
		export namespace Identity {
			export interface Is<G extends GrammarMap, K extends Under<'expression.binary.identity.is'> = 'expression.binary.identity.is'> extends SubKindOf<V.Expression.Binary.Identity<G, K>> {
				// claimed by p
				readonly $path: K;
				readonly left: Slot<
					G,
					K,
					'left',
					| V.Expression.Any<G>
					| V.Identifier.Any<G>
					| V.Literal.Any<G>
					| V.Pattern.Rest<G>
				>;
				readonly operator?: Slot<G, K, 'operator', unknown>;
			}
			export interface IsNot<G extends GrammarMap, K extends Under<'expression.binary.identity.is_not'> = 'expression.binary.identity.is_not'> extends SubKindOf<V.Expression.Binary.Identity<G, K>> {
				// claimed by p
				readonly $path: K;
				readonly left: Slot<
					G,
					K,
					'left',
					| V.Expression.Any<G>
					| V.Identifier.Any<G>
					| V.Literal.Any<G>
					| V.Pattern.Rest<G>
				>;
				readonly operator?: Slot<G, K, 'operator', unknown>;
			}
		}
	}
}
