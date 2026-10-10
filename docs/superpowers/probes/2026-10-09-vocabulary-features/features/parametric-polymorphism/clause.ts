import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Default<G extends GrammarContext> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.default';
		readonly type: G['slots']['clause.default']['type'];
	}
}
