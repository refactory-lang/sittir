import type { GrammarMap } from '../../map.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Function<G extends GrammarMap> {
		readonly receiver?: V.Declaration.Parameter.Receiver<G>;
		// rt only
	}
	export namespace Function {
		export interface Signature<G extends GrammarMap> {
			readonly receiver?: V.Declaration.Parameter.Receiver<G>;
		}
	}
	export interface Method<G extends GrammarMap> {
		readonly receiver?: V.Declaration.Parameter.Receiver<G>;
		// rt only
	}
	export namespace Method {
		export interface Signature<G extends GrammarMap> {
			readonly receiver?: V.Declaration.Parameter.Receiver<G>;
		}
	}
	export namespace Parameter {
		export interface Receiver<G extends GrammarMap> extends SubKindOf<V.Declaration.Parameter<G>> {
			// claimed by rt
			readonly $kind: 'declaration.parameter.receiver';
			readonly name?: never;
			readonly mutable?: Flag;
			// r only
		}
	}
	export namespace Signature {
		export interface Call<G extends GrammarMap> {
			readonly receiver?: V.Declaration.Parameter.Receiver<G>;
		}
	}
}
