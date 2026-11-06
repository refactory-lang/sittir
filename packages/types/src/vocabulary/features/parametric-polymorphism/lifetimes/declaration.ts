import type { GrammarMap } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Parameter {
		export interface Receiver<G extends GrammarMap, K extends Under<'declaration.parameter.receiver'> = 'declaration.parameter.receiver'> {
			readonly lifetime?: V.Identifier.Lifetime<G>;
			// r only
		}
	}
	export namespace TypeParameter {
		export interface Lifetime<G extends GrammarMap, K extends Under<'declaration.type_parameter.lifetime'> = 'declaration.type_parameter.lifetime'> extends SubKindOf<V.Declaration.TypeParameter<G, K>, 'attributes' | 'name'> {
			// claimed by r
			readonly $kind: K;
			readonly const?: never;
			readonly default?: never;
			readonly name: V.Identifier.Lifetime<G>;
		}
	}
}
