import type { GrammarContext } from '../../../context.ts';
export namespace Declaration {
	export interface Field<G extends GrammarContext<G>> {
		readonly accessor?: boolean;
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly accessor?: G['slots']['declaration.method']['accessor'];
	}
	export namespace Method {
		export interface Getter<G extends GrammarContext<G>> {
			readonly accessor: 'get';
		}
		export interface Setter<G extends GrammarContext<G>> {
			readonly accessor: 'set';
		}
		export interface Signature<G extends GrammarContext<G>> {
			readonly accessor?: G['slots']['declaration.method.signature']['accessor'];
		}
	}
}
