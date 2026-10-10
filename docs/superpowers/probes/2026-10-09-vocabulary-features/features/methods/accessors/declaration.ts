import type { GrammarContext } from '../../../context.ts';
export namespace Declaration {
	export interface Field<G extends GrammarContext> {
		readonly accessor?: boolean;
	}
	export interface Method<G extends GrammarContext> {
		readonly accessor?: G['slots']['declaration.method']['accessor'];
	}
	export namespace Method {
		export interface Getter<G extends GrammarContext> {
			readonly accessor: 'get';
		}
		export interface Setter<G extends GrammarContext> {
			readonly accessor: 'set';
		}
		export interface Signature<G extends GrammarContext> {
			readonly accessor?: G['slots']['declaration.method.signature']['accessor'];
		}
	}
}
