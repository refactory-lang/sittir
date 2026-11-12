import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Signature {
		export interface Call<G extends GrammarMap, K extends Under<'declaration.signature.call'> = 'declaration.signature.call'> {
			readonly receiver?: Slot<
				G,
				K,
				'receiver',
				| V.Declaration.Parameter.Receiver<G>
				| V.Declaration.Parameter<G>
				| V.Declaration.Parameter.Private<G>
				| V.Declaration.Parameter.Protected<G>
				| V.Declaration.Parameter.Public<G>
			>;
		}
	}
}
