import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export interface Struct<G extends GrammarContext<G>> extends SubKindOf<V.Element<G>> {
		readonly $kind: 'element.struct';
	}
	export namespace Struct {
		export interface Base<G extends GrammarContext<G>> extends SubKindOf<V.Element.Struct<G>> {
			readonly $kind: 'element.struct.base';
			readonly value: G['slots']['element.struct.base']['value'];
		}
		export interface Field<G extends GrammarContext<G>> extends SubKindOf<V.Element.Struct<G>> {
			readonly $kind: 'element.struct.field';
			readonly field: G['identifier'] | V.Literal.Number.Integer<G>;
			readonly value?: G['slots']['element.struct.field']['value'];
		}
	}
}
