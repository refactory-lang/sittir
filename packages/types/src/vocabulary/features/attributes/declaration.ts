import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface EnumMember<G extends GrammarMap, K extends Under<'declaration.enum_member'> = 'declaration.enum_member'> {
		readonly attributes?: Slot<G, K, 'attributes', V.Attribute.Any<G>>[];
		// r only
	}
	export interface Field<G extends GrammarMap, K extends Under<'declaration.field'> = 'declaration.field'> {
		readonly attributes?: Slot<G, K, 'attributes', V.Attribute.Any<G>>[];
		// r only
	}
	export interface Parameter<G extends GrammarMap, K extends Under<'declaration.parameter'> = 'declaration.parameter'> {
		readonly attributes?: Slot<G, K, 'attributes', V.Attribute.Any<G>>[];
		// r only
	}
	export interface TypeParameter<G extends GrammarMap, K extends Under<'declaration.type_parameter'> = 'declaration.type_parameter'> {
		readonly attributes?: Slot<G, K, 'attributes', V.Attribute.Any<G>>[];
		// r only
	}
	export namespace TypeParameter {
		export interface Lifetime<G extends GrammarMap, K extends Under<'declaration.type_parameter.lifetime'> = 'declaration.type_parameter.lifetime'> {
			readonly attributes?: Slot<G, K, 'attributes', V.Attribute.Any<G>>[];
		}
		export interface Value<G extends GrammarMap, K extends Under<'declaration.type_parameter.value'> = 'declaration.type_parameter.value'> {
			readonly attributes?: Slot<G, K, 'attributes', V.Attribute.Any<G>>[];
		}
	}
}
