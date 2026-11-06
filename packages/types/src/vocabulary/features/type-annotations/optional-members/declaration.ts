import type { GrammarMap, Slot } from '../../../map.ts';
import type { Flag } from '../../../utils.ts';
export namespace Declaration {
	export interface Field<G extends GrammarMap> {
		readonly optional?: Flag;
		// t only
		readonly optionality?: Slot<G, 'declaration.field', 'optionality', string>;
		// t only
	}
	export namespace Field {
		export interface Signature<G extends GrammarMap> {
			readonly optional?: Flag;
		}
	}
	export interface Method<G extends GrammarMap> {
		readonly optional?: Flag;
		// t only
	}
	export namespace Method {
		export interface Signature<G extends GrammarMap> {
			readonly optional?: Flag;
			// t only
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarMap> {
				readonly optional?: Flag;
			}
		}
	}
	export interface Property<G extends GrammarMap> {
		readonly optionality?: Slot<G, 'declaration.property', 'optionality', string>;
	}
	export interface Parameter<G extends GrammarMap> {
		readonly optional?: Flag;
		// t only
	}
}
