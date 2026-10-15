import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Type {
	export interface Nullable<G extends GrammarContext<G>> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.nullable';
		readonly type: G['slots']['type.nullable']['type'];
	}
}
