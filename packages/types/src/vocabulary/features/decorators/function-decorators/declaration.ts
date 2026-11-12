import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
		readonly decorators?: Slot<G, K, 'decorators', V.Attribute.Decorator<G>>[];
		// p only
	}
}
