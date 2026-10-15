import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Declaration {
	export interface Extension<G extends GrammarContext<G>> {
		readonly unsafe?: Flag;
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarContext<G>> {
			readonly unsafe?: Flag;
		}
	}
	export interface Function<G extends GrammarContext<G>> {
		readonly unsafe?: Flag;
		// r only
	}
	export namespace Interface {
		export interface Trait<G extends GrammarContext<G>> {
			readonly unsafe?: Flag;
		}
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly unsafe?: Flag;
		// rt only
	}
	export namespace Module {
		export interface Foreign<G extends GrammarContext<G>> {
			readonly unsafe?: Flag;
		}
	}
}
