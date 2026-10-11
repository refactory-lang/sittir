import type { GrammarContext } from '../../context.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarContext<G>> {
		readonly decorators?: V.Attribute.Decorator<G>[];
	}
	export interface Field<G extends GrammarContext<G>> {
		readonly decorators?: V.Attribute.Decorator<G>[];
		// t only
	}
	export interface Function<G extends GrammarContext<G>> {
		readonly decorators?: V.Attribute.Decorator<G>[];
		// p only
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly decorators?: V.Attribute.Decorator<G>[];
		// t only
	}
	export interface Parameter<G extends GrammarContext<G>> {
		readonly decorators?: V.Attribute.Decorator<G>[];
		// t only
	}
}
