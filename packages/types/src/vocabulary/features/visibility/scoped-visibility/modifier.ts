import type { GrammarContext } from '../../../context.ts';
export namespace Modifier {
	export namespace Visibility {
		export namespace Public {
			export interface Restricted<G extends GrammarContext<G>> {
				readonly scope: G['identifier'];
				// r only
			}
		}
	}
}
