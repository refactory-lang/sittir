import type { GrammarContext } from '../../context.ts';
export namespace Declaration {
	export interface Parameter<G extends GrammarContext> {
		readonly default?: G['slots']['declaration.parameter']['default'];
	}
	export namespace Parameter {
		export interface Default<G extends GrammarContext> {
			readonly default: G['slots']['declaration.parameter.default']['default'];
		}
		export interface Optional<G extends GrammarContext> {
			readonly default?: G['slots']['declaration.parameter.optional']['default'];
		}
		export interface TypedDefault<G extends GrammarContext> {
			readonly default: G['slots']['declaration.parameter.typed_default']['default'];
		}
	}
}
