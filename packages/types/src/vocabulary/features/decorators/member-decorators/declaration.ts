import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Field<G extends GrammarMap, K extends Under<'declaration.field'> = 'declaration.field'> {
		readonly decorators?: Slot<G, K, 'decorators', V.Attribute.Decorator<G>>[];
		// t only
	}
	export interface Parameter<G extends GrammarMap, K extends Under<'declaration.parameter'> = 'declaration.parameter'> {
		readonly decorators?: Slot<G, K, 'decorators', V.Attribute.Decorator<G>>[];
		// t only
	}
}
