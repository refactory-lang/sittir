import type { GrammarMap } from '../../../../map.ts';
import type { Flag } from '../../../../utils.ts';
export namespace Declaration {
	export interface Field<G extends GrammarMap> {
		readonly override?: Flag;
		// t only
	}
	export namespace Field {
		export interface Signature<G extends GrammarMap> {
			readonly override?: Flag;
		}
	}
	export interface Method<G extends GrammarMap> {
		readonly override?: Flag;
		// t only
	}
	export namespace Method {
		export interface Signature<G extends GrammarMap> {
			readonly override?: Flag;
			// t only
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarMap> {
				readonly override?: Flag;
			}
		}
	}
	export interface Parameter<G extends GrammarMap> {
		readonly override?: Flag;
		// t only
	}
	export interface Property<G extends GrammarMap> {
		readonly override?: Flag;
	}
}
