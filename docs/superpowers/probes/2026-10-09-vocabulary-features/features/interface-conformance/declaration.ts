import type { GrammarContext } from '../../context.ts';
export namespace Declaration {
	export interface Class<G extends GrammarContext> {
		readonly implements?: G['slots']['declaration.class']['implements'][];
	}
	export namespace Class {
		export interface Abstract<G extends GrammarContext> {
			readonly implements?: G['slots']['declaration.class.abstract']['implements'][];
		}
	}
	export interface Extension<G extends GrammarContext> {
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarContext> {
		}
	}
}
