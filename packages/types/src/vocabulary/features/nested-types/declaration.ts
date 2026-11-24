import type { GrammarMap } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export namespace Member {
		export type Type<G extends GrammarMap> = V.Declaration.Type.Any<G>;
	}
}
