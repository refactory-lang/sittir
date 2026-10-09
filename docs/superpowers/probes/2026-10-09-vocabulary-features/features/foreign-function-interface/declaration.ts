import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Function<G extends GrammarContext> {
		readonly extern?: V.Modifier.Extern<G>;
	}
	export interface Method<G extends GrammarContext> {
		readonly extern?: V.Modifier.Extern<G>;
	}
	export namespace Method {
		export interface Static<G extends GrammarContext> {
			readonly extern?: V.Modifier.Extern<G>;
		}
	}
	export namespace Module {
		export interface Foreign<G extends GrammarContext> extends SubKindOf<V.Declaration.Module<G>> {
			readonly $kind: 'declaration.module.foreign';
		}
	}
	export namespace Parameter {
		export interface Variadic<G extends GrammarContext> extends SubKindOf<V.Declaration.Parameter<G>> {
			readonly $kind: 'declaration.parameter.variadic';
			readonly mutable?: boolean;
			readonly pattern?: G['slots']['declaration.parameter.variadic']['pattern'];
		}
	}
}
