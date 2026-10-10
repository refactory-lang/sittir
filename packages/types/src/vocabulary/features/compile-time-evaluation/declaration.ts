import type { GrammarContext } from '../../context.ts';
export namespace Declaration {
	export interface Function<G extends GrammarContext<G>> {
		readonly const?: boolean;
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly const?: boolean;
	}
	export namespace Method {
		export interface Static<G extends GrammarContext<G>> {
			readonly const?: boolean;
		}
	}
}
