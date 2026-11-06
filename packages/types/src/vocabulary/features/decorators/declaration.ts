import type { GrammarMap } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarMap> {
		readonly decorators?: V.Attribute.Decorator<G>[];
	}
	export interface Constructor<G extends GrammarMap> {
		readonly decorators?: V.Attribute.Decorator<G>[];
	}
	export interface Field<G extends GrammarMap> {
		readonly decorators?: V.Attribute.Decorator<G>[];
		// t only
	}
	export interface Function<G extends GrammarMap> {
		readonly decorators?: V.Attribute.Decorator<G>[];
		// p only
	}
	export interface Method<G extends GrammarMap> {
		readonly decorators?: V.Attribute.Decorator<G>[];
		// t only
	}
	export interface Parameter<G extends GrammarMap> {
		readonly decorators?: V.Attribute.Decorator<G>[];
		// t only
	}
	export interface Property<G extends GrammarMap> {
		readonly decorators?: V.Attribute.Decorator<G>[];
	}
}
