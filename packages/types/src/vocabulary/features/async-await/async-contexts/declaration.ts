import type { GrammarMap } from '../../../map.ts';
import type { Flag, Under } from '../../../utils.ts';
export namespace Declaration {
	export namespace Member {
		export interface Constructor<G extends GrammarMap, K extends Under<'declaration.member.constructor'> = 'declaration.member.constructor'> {
			readonly async?: Flag;
			// p only
		}
	}
}
