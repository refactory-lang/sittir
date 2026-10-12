import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Clause {
	export namespace Comprehension {
		export interface For<G extends GrammarContext<G>> {
			readonly async?: Flag;
		}
	}
}
