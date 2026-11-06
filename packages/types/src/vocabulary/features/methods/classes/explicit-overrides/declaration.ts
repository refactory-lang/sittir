import type { GrammarMap } from '../../../../map.ts';
import type { Flag, Under } from '../../../../utils.ts';
export namespace Declaration {
	export interface Field<G extends GrammarMap, K extends Under<'declaration.field'> = 'declaration.field'> {
		readonly override?: Flag;
		// t only
	}
	export namespace Field {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.field.signature'> = 'declaration.field.signature'> {
			readonly override?: Flag;
		}
	}
	export interface Method<G extends GrammarMap, K extends Under<'declaration.method'> = 'declaration.method'> {
		readonly override?: Flag;
		// t only
	}
	export namespace Method {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.method.signature'> = 'declaration.method.signature'> {
			readonly override?: Flag;
			// t only
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarMap, K extends Under<'declaration.method.signature.abstract'> = 'declaration.method.signature.abstract'> {
				readonly override?: Flag;
			}
		}
	}
	export interface Parameter<G extends GrammarMap, K extends Under<'declaration.parameter'> = 'declaration.parameter'> {
		readonly override?: Flag;
		// t only
	}
	export interface Property<G extends GrammarMap, K extends Under<'declaration.property'> = 'declaration.property'> {
		readonly override?: Flag;
	}
}
