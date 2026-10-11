import type { GrammarContext } from '../../context.ts';
export namespace Declaration {
	export interface EnumMember<G extends GrammarContext<G>> {
		readonly attributes?: G['attribute'][];
		// r only
	}
	export interface Field<G extends GrammarContext<G>> {
		readonly attributes?: G['attribute'][];
		// r only
	}
	export interface TypeParameter<G extends GrammarContext<G>> {
		readonly attributes?: G['attribute'][];
		// r only
	}
	export namespace TypeParameter {
		export interface Lifetime<G extends GrammarContext<G>> {
			readonly attributes?: G['attribute'][];
		}
		export interface Value<G extends GrammarContext<G>> {
			readonly attributes?: G['attribute'][];
		}
	}
}
