import type { GrammarMap } from '../../map.ts';
import type { Flag, Under } from '../../utils.ts';
export namespace Type {
	export interface Function<G extends GrammarMap, K extends Under<'type.function'> = 'type.function'> {
		readonly unsafe?: Flag;
		// r only
	}
}
