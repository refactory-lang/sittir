import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export interface Interpolated<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String<G>> {
			// claimed by pt
			readonly $kind: 'literal.string.interpolated';
		}
		export namespace Interpolated {
			export interface Multiline<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String.Interpolated<G>> {
				// claimed by p
				readonly $kind: 'literal.string.interpolated.multiline';
			}
		}
	}
}
