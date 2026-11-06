import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export namespace Struct {
		export interface Field<G extends GrammarMap, K extends Under<'element.struct.field'> = 'element.struct.field'> {
			readonly attributes?: Slot<G, 'element.struct.field', 'attributes', V.Attribute.Any<G>>[];
		}
	}
}
