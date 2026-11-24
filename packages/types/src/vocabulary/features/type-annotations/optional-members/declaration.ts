import type { GrammarMap, Slot } from '../../../map.ts';
import type { Flag, Under } from '../../../utils.ts';
export namespace Declaration {
	export namespace Member {
		export interface Field<G extends GrammarMap, K extends Under<'declaration.member.field'> = 'declaration.member.field'> {
			readonly optional?: Flag;
			// t only
			readonly optionality?: Slot<G, K, 'optionality', string>;
			// t only
		}
		export namespace Field {
			export interface Signature<G extends GrammarMap, K extends Under<'declaration.member.field.signature'> = 'declaration.member.field.signature'> {
				readonly optional?: Flag;
			}
		}
		export interface Method<G extends GrammarMap, K extends Under<'declaration.member.method'> = 'declaration.member.method'> {
			readonly optional?: Flag;
			// t only
		}
		export namespace Method {
			export interface Signature<G extends GrammarMap, K extends Under<'declaration.member.method.signature'> = 'declaration.member.method.signature'> {
				readonly optional?: Flag;
				// t only
			}
			export namespace Signature {
				export interface Abstract<G extends GrammarMap, K extends Under<'declaration.member.method.signature.abstract'> = 'declaration.member.method.signature.abstract'> {
					readonly optional?: Flag;
				}
			}
		}
		export interface Property<G extends GrammarMap, K extends Under<'declaration.member.property'> = 'declaration.member.property'> {
			readonly optionality?: Slot<G, K, 'optionality', string>;
		}
	}
	export interface Parameter<G extends GrammarMap, K extends Under<'declaration.parameter'> = 'declaration.parameter'> {
		readonly optional?: Flag;
		// t only
	}
}
