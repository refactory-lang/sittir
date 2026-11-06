import type { GrammarMap } from '../../map.ts';
import type { Flag } from '../../utils.ts';
export namespace Type {
	export interface Pointer<G extends GrammarMap> {
		readonly writable?: Flag;
	}
	export interface Reference<G extends GrammarMap> {
		readonly exclusive?: Flag;
	}
}
