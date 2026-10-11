import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Type {
	export interface Pointer<G extends GrammarContext<G>> {
		readonly writable?: Flag;
	}
	export interface Reference<G extends GrammarContext<G>> {
		readonly exclusive?: Flag;
	}
}
