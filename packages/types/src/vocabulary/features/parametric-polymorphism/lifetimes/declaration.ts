import type { GrammarMap } from '../../../map.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Parameter {
		export interface Receiver<G extends GrammarMap> {
			readonly lifetime?: V.Identifier.Lifetime<G>;
			// r only
		}
	}
	export namespace TypeParameter {
		export interface Lifetime<G extends GrammarMap> extends SubKindOf<V.Declaration.TypeParameter<G>, 'attributes' | 'name'> {
			// claimed by r
			readonly $kind: 'declaration.type_parameter.lifetime';
			readonly const?: never;
			readonly default?: never;
			readonly name: V.Identifier.Lifetime<G>;
		}
	}
}
