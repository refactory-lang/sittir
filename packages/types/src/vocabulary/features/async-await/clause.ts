import type { GrammarMap } from '../../map.ts';
import type { Flag } from '../../utils.ts';
export namespace Clause {
	export namespace Comprehension {
		export interface For<G extends GrammarMap> {
			readonly async?: Flag;
		}
	}
}
