import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export interface TypeArgument<G extends GrammarContext> extends SubKindOf<V.Element<G>> {
		readonly $kind: 'element.type_argument';
		readonly content: G['slots']['element.type_argument']['content'];
	}
}
