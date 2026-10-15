import type { GrammarContext } from '../../context.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Function<G extends GrammarContext<G>> {
		readonly receiver?: V.Declaration.Parameter.Receiver<G>;
		// t only
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly receiver?: V.Declaration.Parameter.Receiver<G>;
		// rt only
	}
	export namespace Parameter {
		export interface Receiver<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Parameter<G>> {
			// claimed by rt
			readonly $kind: 'declaration.parameter.receiver';
			readonly mutable?: Flag;
			// r only
		}
	}
	export namespace Signature {
		export interface Call<G extends GrammarContext<G>> {
			readonly receiver?: V.Declaration.Parameter.Receiver<G>;
		}
	}
}
