import type { GrammarContext } from '../../context.ts';
export namespace Declaration {
	export interface Function<G extends GrammarContext> {
		readonly async?: boolean;
	}
	export namespace Function {
		export interface Generator<G extends GrammarContext> {
			readonly async?: boolean;
		}
		export interface Signature<G extends GrammarContext> {
			readonly async?: boolean;
		}
	}
	export interface Method<G extends GrammarContext> {
		readonly async?: boolean;
	}
	export namespace Method {
		export interface Signature<G extends GrammarContext> {
			readonly async?: boolean;
		}
		export interface Static<G extends GrammarContext> {
			readonly async?: boolean;
		}
	}
}
