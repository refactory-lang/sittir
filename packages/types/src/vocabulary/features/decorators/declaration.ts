import type { GrammarContext } from '../../context.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarContext<G>> {
		readonly decorators?: V.Attribute.Decorator<G>[];
	}
	export namespace Class {
		export interface Abstract<G extends GrammarContext<G>> {
			readonly decorators?: V.Attribute.Decorator<G>[];
		}
	}
	export interface Field<G extends GrammarContext<G>> {
		readonly decorators?: V.Attribute.Decorator<G>[];
	}
	export interface Function<G extends GrammarContext<G>> {
		readonly decorators?: V.Attribute.Decorator<G>[];
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly decorators?: V.Attribute.Decorator<G>[];
	}
	export interface Parameter<G extends GrammarContext<G>> {
		readonly decorators?: V.Attribute.Decorator<G>[];
	}
	export namespace Parameter {
		export interface Optional<G extends GrammarContext<G>> {
			readonly decorators?: V.Attribute.Decorator<G>[];
		}
	}
}
