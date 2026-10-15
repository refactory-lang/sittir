import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Argument {
	export interface Named<G extends GrammarContext<G>> extends SubKindOf<V.Argument<G>> {
		// claimed by p
		readonly $kind: 'argument.named';
		readonly name: G['identifier'];
		readonly value: G['slots']['argument.named']['value'];
	}
}
