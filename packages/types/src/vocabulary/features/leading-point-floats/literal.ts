import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
export namespace Literal {
	export namespace Number {
		export namespace Float {
			export interface LeadingPoint<G extends GrammarMap, K extends Under<'literal.number.float.leading_point'> = 'literal.number.float.leading_point'> {
				readonly integer?: Slot<G, K, 'integer', unknown>;
				// p only
			}
		}
	}
}
