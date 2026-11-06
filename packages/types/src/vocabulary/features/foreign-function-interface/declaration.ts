import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
		readonly extern?: Slot<G, K, 'extern', V.Modifier.Extern<G>>;
		// r only
	}
	export interface Method<G extends GrammarMap, K extends Under<'declaration.method'> = 'declaration.method'> {
		readonly extern?: Slot<G, K, 'extern', V.Modifier.Extern<G>>;
		// rt only
	}
	export namespace Module {
		export interface Foreign<G extends GrammarMap, K extends Under<'declaration.module.foreign'> = 'declaration.module.foreign'> extends SubKindOf<V.Declaration.Module<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly extern: Slot<G, K, 'extern', V.Modifier.Extern<G>>;
		}
	}
	export namespace Parameter {
		export interface Variadic<G extends GrammarMap, K extends Under<'declaration.parameter.variadic'> = 'declaration.parameter.variadic'> extends SubKindOf<V.Declaration.Parameter<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly mutable?: Flag;
			readonly pattern?: Slot<G, K, 'pattern', unknown>;
		}
	}
}
