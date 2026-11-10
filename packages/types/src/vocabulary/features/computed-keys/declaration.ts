import type { GrammarMap } from '../../map.ts';
import type { Flag, Under } from '../../utils.ts';
export namespace Declaration {
	export interface Field<G extends GrammarMap, K extends Under<'declaration.field'> = 'declaration.field'> {
		readonly computed?: Flag;
		// t only
	}
	export interface Method<G extends GrammarMap, K extends Under<'declaration.method'> = 'declaration.method'> {
		readonly computed?: Flag;
		// t only
	}
	export interface Property<G extends GrammarMap, K extends Under<'declaration.property'> = 'declaration.property'> {
		readonly computed?: Flag;
	}
}
