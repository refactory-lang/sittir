import type { GrammarMap, Slot } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export namespace Struct {
		export interface Field<G extends GrammarMap> {
			readonly attributes?: Slot<G, 'element.struct.field', 'attributes', V.Attribute.Any<G>>[];
		}
	}
}
