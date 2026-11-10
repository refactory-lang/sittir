import type { GrammarMap } from '../../map.ts';
import type { Flag, Under } from '../../utils.ts';
export namespace Type {
	export interface Pointer<G extends GrammarMap, K extends Under<'type.pointer'> = 'type.pointer'> {
		readonly writable?: Flag;
	}
	export interface Reference<G extends GrammarMap, K extends Under<'type.reference'> = 'type.reference'> {
		readonly exclusive?: Flag;
	}
}
