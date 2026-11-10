import type { GrammarMap } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Method {
		export interface Special<G extends GrammarMap, K extends Under<'declaration.method.special'> = 'declaration.method.special'> extends SubKindOf<V.Declaration.Method<G, K>, 'name'> {
			readonly $path: K;
			readonly name: `__${string}__`;
			readonly stem: string;
		}
	}
}
