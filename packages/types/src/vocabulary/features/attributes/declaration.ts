import type { GrammarContext } from '../../context.ts';
export namespace Declaration {
	export interface EnumMember<G extends GrammarContext<G>> {
		readonly attributes?: G['attribute'][];
	}
	export interface Field<G extends GrammarContext<G>> {
		readonly attributes?: G['attribute'][];
	}
	export interface TypeParameter<G extends GrammarContext<G>> {
		readonly attributes?: G['attribute'][];
	}
	export namespace TypeParameter {
		export interface Const<G extends GrammarContext<G>> {
			readonly attributes?: G['attribute'][];
		}
		export interface Lifetime<G extends GrammarContext<G>> {
			readonly attributes?: G['attribute'][];
		}
	}
}
