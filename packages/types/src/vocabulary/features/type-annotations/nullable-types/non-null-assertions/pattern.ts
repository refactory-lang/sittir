import type { GrammarMap } from '../../../../map.ts';
import type * as V from '../../../../index.ts';
export namespace Pattern {
	export type NonNull<G extends GrammarMap> = V.Expression.Cast.NonNull<G>;
}
