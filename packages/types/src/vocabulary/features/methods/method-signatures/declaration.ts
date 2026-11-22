import type { GrammarMap, Slot } from '../../../map.ts';
import type { Flag, SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Member {
		export namespace Method {
			export interface Signature<G extends GrammarMap, K extends Under<'declaration.member.method.signature'> = 'declaration.member.method.signature'> extends SubKindOf<V.Declaration.Member.Method<G, K>, 'async' | 'name' | 'optional' | 'override' | 'parameters' | 'readonly' | 'receiver' | 'returnType' | 'static' | 'typeParameters' | 'whereClause'> {
				// claimed by rt
				readonly $path: K;
				readonly name: Slot<G, K, 'name', V.Expression.Any<G> | string>;
				readonly parameters: Slot<G, K, 'parameters', V.Declaration.Parameter.AnyWithType<G> | V.Clause.Bounds.Removed<G> | string>[];
				readonly static?: Flag;
				// t only
			}
		}
	}
}
