import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export interface Class<G extends GrammarMap, K extends Under<'expression.class'> = 'expression.class'> {
		readonly typeParameters?: Slot<G, K, 'typeParameters', V.Declaration.TypeParameter<G>>[];
	}
	export interface Function<G extends GrammarMap, K extends Under<'expression.function'> = 'expression.function'> {
		readonly typeParameters?: Slot<G, K, 'typeParameters', V.Declaration.TypeParameter<G>>[];
	}
}
