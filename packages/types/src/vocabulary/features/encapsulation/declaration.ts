import type { GrammarMap } from '../../map.ts';
import type { Flag } from '../../utils.ts';
export namespace Declaration {
	export interface Field<G extends GrammarMap> {
		readonly privateName?: Flag;
		// t only
	}
	export interface Method<G extends GrammarMap> {
		readonly privateName?: Flag;
		// t only
	}
	export interface Property<G extends GrammarMap> {
		readonly privateName?: Flag;
	}
}
