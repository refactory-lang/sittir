import type { GrammarMap } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarMap, K extends Under<'declaration.class'> = 'declaration.class'> {
		readonly decorators?: V.Attribute.Decorator<G>[];
	}
	export interface Constructor<G extends GrammarMap, K extends Under<'declaration.constructor'> = 'declaration.constructor'> {
		readonly decorators?: V.Attribute.Decorator<G>[];
	}
	export interface Field<G extends GrammarMap, K extends Under<'declaration.field'> = 'declaration.field'> {
		readonly decorators?: V.Attribute.Decorator<G>[];
		// t only
	}
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
		readonly decorators?: V.Attribute.Decorator<G>[];
		// p only
	}
	export interface Method<G extends GrammarMap, K extends Under<'declaration.method'> = 'declaration.method'> {
		readonly decorators?: V.Attribute.Decorator<G>[];
		// t only
	}
	export interface Parameter<G extends GrammarMap, K extends Under<'declaration.parameter'> = 'declaration.parameter'> {
		readonly decorators?: V.Attribute.Decorator<G>[];
		// t only
	}
	export interface Property<G extends GrammarMap, K extends Under<'declaration.property'> = 'declaration.property'> {
		readonly decorators?: V.Attribute.Decorator<G>[];
	}
}
