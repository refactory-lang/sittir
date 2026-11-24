import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export namespace Type {
		export interface Class<G extends GrammarMap, K extends Under<'declaration.type.class'> = 'declaration.type.class'> {
			readonly decorators?: Slot<G, K, 'decorators', V.Attribute.AnyWithExpression<G>>[];
		}
	}
	export namespace Member {
		export interface Constructor<G extends GrammarMap, K extends Under<'declaration.member.constructor'> = 'declaration.member.constructor'> {
			readonly decorators?: Slot<G, K, 'decorators', V.Attribute.AnyWithExpression<G>>[];
		}
		export interface Field<G extends GrammarMap, K extends Under<'declaration.member.field'> = 'declaration.member.field'> {
		}
	}
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
	}
	export namespace Member {
		export interface Method<G extends GrammarMap, K extends Under<'declaration.member.method'> = 'declaration.member.method'> {
			readonly decorators?: Slot<G, K, 'decorators', V.Attribute.AnyWithExpression<G>>[];
			// t only
		}
	}
	export interface Parameter<G extends GrammarMap, K extends Under<'declaration.parameter'> = 'declaration.parameter'> {
	}
	export namespace Member {
		export interface Property<G extends GrammarMap, K extends Under<'declaration.member.property'> = 'declaration.member.property'> {
			readonly decorators?: Slot<G, K, 'decorators', V.Attribute.AnyWithExpression<G>>[];
		}
	}
}
