import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Identifier {
	export interface Lifetime<G extends GrammarContext> extends SubKindOf<V.Identifier<G>> {
		readonly $kind: 'identifier.lifetime';
		readonly name: G['identifier'];
	}
}
