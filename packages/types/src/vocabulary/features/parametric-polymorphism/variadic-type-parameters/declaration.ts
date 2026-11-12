import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace TypeParameter {
		export interface Variadic<G extends GrammarMap, K extends Under<'declaration.type_parameter.variadic'> = 'declaration.type_parameter.variadic'> extends SubKindOf<V.Declaration.TypeParameter<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly const?: never;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		}
	}
}
