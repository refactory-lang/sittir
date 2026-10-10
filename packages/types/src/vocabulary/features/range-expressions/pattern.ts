import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Range<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		readonly $kind: 'pattern.range';
	}
}
