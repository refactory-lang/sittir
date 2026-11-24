import type { GrammarMap } from '../../../../map.ts';
import type * as V from '../../../../index.ts';
export namespace Type {
	export type AnyWithBounds<G extends GrammarMap> = V.Type.Any<G> | V.Clause.Bounds.Any<G>;
}
