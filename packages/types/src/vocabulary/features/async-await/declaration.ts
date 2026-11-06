import type { GrammarMap } from '../../map.ts';
import type { Flag } from '../../utils.ts';
export namespace Declaration {
	export interface Constructor<G extends GrammarMap> {
		readonly async?: Flag;
		// p only
	}
	export interface Function<G extends GrammarMap> {
		readonly async?: Flag;
	}
	export namespace Function {
		export interface Signature<G extends GrammarMap> {
			readonly async?: Flag;
			// t only
		}
	}
	export interface Method<G extends GrammarMap> {
		readonly async?: Flag;
	}
	export namespace Method {
		export interface Signature<G extends GrammarMap> {
			readonly async?: Flag;
			// t only
		}
	}
}
