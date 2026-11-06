import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Type {
	export interface Generic<G extends GrammarMap, K extends Under<'type.generic'> = 'type.generic'> extends SubKindOf<V.Type<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly name?: Slot<G, K, 'name', V.Identifier.Any<G> | string | V.Identifier.Qualified<G>>;
		// pt only
		readonly type?: Slot<G, K, 'type', V.Identifier.Any<G> | string | V.Identifier.Qualified<G>>;
		// r only
		readonly typeArguments?: Slot<
			G,
			K,
			'typeArguments',
			| V.Element.TypeArgument<G>
			| V.Identifier.Any<G>
			| V.Type.Any<G>
		>[];
	}
}
