import type { GrammarMap } from '../../../map.ts';
import type { Flag, Under } from '../../../utils.ts';
export namespace Clause {
	export namespace Comprehension {
		export interface For<G extends GrammarMap, K extends Under<'clause.comprehension.for'> = 'clause.comprehension.for'> {
			readonly async?: Flag;
		}
	}
}
