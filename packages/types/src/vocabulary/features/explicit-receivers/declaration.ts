import type { GrammarMap } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
		readonly receiver?: V.Declaration.Parameter.Receiver<G>;
		// rt only
	}
	export namespace Function {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.function.signature'> = 'declaration.function.signature'> {
			readonly receiver?: V.Declaration.Parameter.Receiver<G>;
		}
	}
	export interface Method<G extends GrammarMap, K extends Under<'declaration.method'> = 'declaration.method'> {
		readonly receiver?: V.Declaration.Parameter.Receiver<G>;
		// rt only
	}
	export namespace Method {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.method.signature'> = 'declaration.method.signature'> {
			readonly receiver?: V.Declaration.Parameter.Receiver<G>;
		}
	}
	export namespace Parameter {
		export interface Receiver<G extends GrammarMap, K extends Under<'declaration.parameter.receiver'> = 'declaration.parameter.receiver'> extends SubKindOf<V.Declaration.Parameter<G, K>> {
			// claimed by rt
			readonly $kind: K;
			readonly name?: never;
			readonly mutable?: Flag;
			// r only
		}
	}
	export namespace Signature {
		export interface Call<G extends GrammarMap, K extends Under<'declaration.signature.call'> = 'declaration.signature.call'> {
			readonly receiver?: V.Declaration.Parameter.Receiver<G>;
		}
	}
}
