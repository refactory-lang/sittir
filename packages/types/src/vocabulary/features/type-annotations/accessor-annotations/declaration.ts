import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Property {
		export interface Getter<G extends GrammarMap, K extends Under<'declaration.property.getter'> = 'declaration.property.getter'> {
			readonly returnType?: Slot<G, K, 'returnType', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
	}
}
