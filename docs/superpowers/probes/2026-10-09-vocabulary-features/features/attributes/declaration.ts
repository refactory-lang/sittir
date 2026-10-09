import type { GrammarContext } from '../../context.ts';
export namespace Declaration {
	export interface EnumMember<G extends GrammarContext> {
		readonly attributes?: G['attribute'][];
	}
	export interface Field<G extends GrammarContext> {
		readonly attributes?: G['attribute'][];
	}
	export interface TypeParameter<G extends GrammarContext> {
		readonly attributes?: G['attribute'][];
	}
	export namespace TypeParameter {
		export interface Const<G extends GrammarContext> {
			readonly attributes?: G['attribute'][];
		}
		export interface Lifetime<G extends GrammarContext> {
			readonly attributes?: G['attribute'][];
		}
	}
}
