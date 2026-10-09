import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Argument {
	export interface Keyword<G extends GrammarContext> extends SubKindOf<V.Argument<G>> {
		readonly $kind: 'argument.keyword';
		readonly name: G['identifier'];
		readonly value: G['slots']['argument.keyword']['value'];
	}
}
