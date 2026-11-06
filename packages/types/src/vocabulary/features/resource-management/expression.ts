import type { GrammarMap } from '../../map.ts';
import type { Flag } from '../../utils.ts';
export namespace Expression {
	export interface Assignment<G extends GrammarMap> {
		readonly disposable?: Flag;
	}
}
