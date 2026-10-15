import type { GrammarContext } from '../../context.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Function<G extends GrammarContext<G>> {
		readonly extern?: V.Modifier.Extern<G>;
		// r only
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly extern?: V.Modifier.Extern<G>;
		// rt only
	}
	export namespace Module {
		export interface Foreign<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Module<G>> {
			// claimed by r
			readonly $kind: 'declaration.module.foreign';
			readonly extern: V.Modifier.Extern<G>;
		}
	}
	export namespace Parameter {
		export interface Variadic<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Parameter<G>> {
			// claimed by r
			readonly $kind: 'declaration.parameter.variadic';
			readonly mutable?: Flag;
			readonly pattern?: G['slots']['declaration.parameter.variadic']['pattern'];
		}
	}
}
