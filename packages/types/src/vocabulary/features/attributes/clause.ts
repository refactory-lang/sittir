import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export namespace Case {
		export interface Match<G extends GrammarMap, K extends Under<'clause.case.match'> = 'clause.case.match'> {
			readonly attributes?: Slot<G, 'clause.case.match', 'attributes', V.Attribute.Any<G>>[];
		}
	}
}
