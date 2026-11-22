import type { GrammarMap } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export namespace Member {
		export type AnyWithStatement<G extends GrammarMap> = V.Declaration.Member.Any<G> | V.Statement.Any<G>;
	}
}
