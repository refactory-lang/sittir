import type { GrammarContext } from '../../context.ts';
export namespace Declaration {
	export interface Extension<G extends GrammarContext<G>> {
		readonly unsafe?: boolean;
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarContext<G>> {
			readonly unsafe?: boolean;
		}
	}
	export interface Function<G extends GrammarContext<G>> {
		readonly unsafe?: boolean;
	}
	export namespace Interface {
		export interface Trait<G extends GrammarContext<G>> {
			readonly unsafe?: boolean;
		}
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly unsafe?: boolean;
	}
	export namespace Method {
		export interface Static<G extends GrammarContext<G>> {
			readonly unsafe?: boolean;
		}
	}
}
