import type { GrammarMap } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Type {
	export type Macro<G extends GrammarMap> = V.Expression.Call.Macro<G>;
}
