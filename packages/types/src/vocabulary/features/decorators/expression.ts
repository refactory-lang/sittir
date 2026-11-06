import type { GrammarMap } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Class<G extends GrammarMap> {
		readonly decorators?: V.Attribute.Decorator<G>[];
	}
}
