import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Function<G extends GrammarMap> {
		readonly extern?: V.Modifier.Extern<G>;
		// r only
	}
	export interface Method<G extends GrammarMap> {
		readonly extern?: V.Modifier.Extern<G>;
		// rt only
	}
	export namespace Module {
		export interface Foreign<G extends GrammarMap> extends SubKindOf<V.Declaration.Module<G>> {
			// claimed by r
			readonly $kind: 'declaration.module.foreign';
			readonly extern: V.Modifier.Extern<G>;
		}
	}
	export namespace Parameter {
		export interface Variadic<G extends GrammarMap> extends SubKindOf<V.Declaration.Parameter<G>> {
			// claimed by r
			readonly $kind: 'declaration.parameter.variadic';
			readonly mutable?: Flag;
			readonly pattern?: Slot<G, 'declaration.parameter.variadic', 'pattern', unknown>;
		}
	}
}
