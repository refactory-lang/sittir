import type { GrammarMap } from '../../map.ts';
import type { Under } from '../../utils.ts';
export namespace Type {
	export interface Abstract<G extends GrammarMap, K extends Under<'type.abstract'> = 'type.abstract'> {
	}
	export interface Function<G extends GrammarMap, K extends Under<'type.function'> = 'type.function'> {
	}
	export namespace Function {
		export interface Constructor<G extends GrammarMap, K extends Under<'type.function.constructor'> = 'type.function.constructor'> {
		}
	}
}
