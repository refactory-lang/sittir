import type { GrammarMap } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Member {
		export namespace Method {
			export interface Special<G extends GrammarMap, K extends Under<'declaration.member.method.special'> = 'declaration.member.method.special'> extends SubKindOf<V.Declaration.Member.Method<G, K>, 'name'> {
				readonly $path: K;
				readonly name: `__${string}__`;
				readonly stem: string;
			}
		}
	}
}
