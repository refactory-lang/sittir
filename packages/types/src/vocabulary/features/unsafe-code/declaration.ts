import type { GrammarMap } from '../../map.ts';
import type { Flag } from '../../utils.ts';
export namespace Declaration {
	export interface Extension<G extends GrammarMap> {
		readonly unsafe?: Flag;
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarMap> {
			readonly unsafe?: Flag;
		}
	}
	export interface Function<G extends GrammarMap> {
		readonly unsafe?: Flag;
		// r only
	}
	export namespace Interface {
		export interface Trait<G extends GrammarMap> {
			readonly unsafe?: Flag;
		}
	}
	export interface Method<G extends GrammarMap> {
		readonly unsafe?: Flag;
		// rt only
	}
	export namespace Module {
		export interface Foreign<G extends GrammarMap> {
			readonly unsafe?: Flag;
		}
	}
}
