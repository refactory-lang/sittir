import type { GrammarMap, Slot } from '../../../map.ts';
import type { Flag, Under } from '../../../utils.ts';
export namespace Declaration {
	export interface Field<G extends GrammarMap, K extends Under<'declaration.field'> = 'declaration.field'> {
		readonly optional?: Flag;
		// t only
		readonly optionality?: Slot<G, 'declaration.field', 'optionality', string>;
		// t only
	}
	export namespace Field {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.field.signature'> = 'declaration.field.signature'> {
			readonly optional?: Flag;
		}
	}
	export interface Method<G extends GrammarMap, K extends Under<'declaration.method'> = 'declaration.method'> {
		readonly optional?: Flag;
		// t only
	}
	export namespace Method {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.method.signature'> = 'declaration.method.signature'> {
			readonly optional?: Flag;
			// t only
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarMap, K extends Under<'declaration.method.signature.abstract'> = 'declaration.method.signature.abstract'> {
				readonly optional?: Flag;
			}
		}
	}
	export interface Property<G extends GrammarMap, K extends Under<'declaration.property'> = 'declaration.property'> {
		readonly optionality?: Slot<G, 'declaration.property', 'optionality', string>;
	}
	export interface Parameter<G extends GrammarMap, K extends Under<'declaration.parameter'> = 'declaration.parameter'> {
		readonly optional?: Flag;
		// t only
	}
}
