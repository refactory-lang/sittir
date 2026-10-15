import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Identifier {
	export interface Receiver<G extends GrammarContext<G>> extends SubKindOf<V.Identifier<G>> {
		// claimed by rt
		readonly $kind: 'identifier.receiver';
	}
}
