import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Identifier {
	export interface Self<G extends GrammarContext<G>> extends SubKindOf<V.Identifier<G>> {
		readonly $kind: 'identifier.self';
	}
}
