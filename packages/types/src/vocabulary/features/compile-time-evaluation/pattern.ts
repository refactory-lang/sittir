import type { GrammarMap } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export type Const<G extends GrammarMap> = V.Statement.Block.Const<G>;
}
