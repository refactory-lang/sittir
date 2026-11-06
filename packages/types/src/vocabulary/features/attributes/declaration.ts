import type { GrammarMap, Slot } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface EnumMember<G extends GrammarMap> {
		readonly attributes?: Slot<G, 'declaration.enum_member', 'attributes', V.Attribute.Any<G>>[];
		// r only
	}
	export interface Field<G extends GrammarMap> {
		readonly attributes?: Slot<G, 'declaration.field', 'attributes', V.Attribute.Any<G>>[];
		// r only
	}
	export interface Parameter<G extends GrammarMap> {
		readonly attributes?: Slot<G, 'declaration.parameter', 'attributes', V.Attribute.Any<G>>[];
		// r only
	}
	export interface TypeParameter<G extends GrammarMap> {
		readonly attributes?: Slot<G, 'declaration.type_parameter', 'attributes', V.Attribute.Any<G>>[];
		// r only
	}
	export namespace TypeParameter {
		export interface Lifetime<G extends GrammarMap> {
			readonly attributes?: Slot<G, 'declaration.type_parameter.lifetime', 'attributes', V.Attribute.Any<G>>[];
		}
		export interface Value<G extends GrammarMap> {
			readonly attributes?: Slot<G, 'declaration.type_parameter.value', 'attributes', V.Attribute.Any<G>>[];
		}
	}
}
