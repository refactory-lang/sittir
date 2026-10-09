import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Element {
	export interface TypeBinding<G extends GrammarContext> extends SubKindOf<V.Element<G>> {
		readonly $kind: 'element.type_binding';
		readonly name: V.Identifier.Type<G>;
		readonly type: G['slots']['element.type_binding']['type'];
		readonly typeArguments?: V.Element.TypeArgument<G>[];
	}
}
