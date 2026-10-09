import type { GrammarContext } from '../../context.ts';
export namespace Element {
	export namespace Struct {
		export interface Field<G extends GrammarContext> {
			readonly attributeItems?: G['attribute'][];
		}
	}
}
