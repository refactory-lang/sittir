import type { GrammarMap } from '../../../../map.ts';
import type { Flag } from '../../../../utils.ts';
export namespace Declaration {
	export interface Field<G extends GrammarMap> {
		readonly definite?: Flag;
		// t only
	}
	export interface Property<G extends GrammarMap> {
		readonly definite?: Flag;
	}
	export interface Variable<G extends GrammarMap> {
		readonly definite?: Flag;
		// t only
	}
}
