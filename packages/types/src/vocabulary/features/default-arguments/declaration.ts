import type { GrammarContext } from '../../context.ts';
export namespace Declaration {
	export interface Parameter<G extends GrammarContext<G>> {
		readonly default?: G['slots']['declaration.parameter']['default'];
		// pt only
	}
	export namespace Parameter {
		export interface Default<G extends GrammarContext<G>> {
			readonly default: G['slots']['declaration.parameter.default']['default'];
		}
		export interface TypedDefault<G extends GrammarContext<G>> {
			readonly default: G['slots']['declaration.parameter.typed_default']['default'];
		}
	}
}
