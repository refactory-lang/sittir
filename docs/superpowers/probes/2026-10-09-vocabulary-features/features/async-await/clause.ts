import type { GrammarContext } from '../../context.ts';
export namespace Clause {
	export namespace Comprehension {
		export interface For<G extends GrammarContext> {
			readonly async?: boolean;
		}
	}
}
