import type { GrammarContext } from '../../context.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Class<G extends GrammarContext<G>> {
		readonly decorators?: V.Attribute.Decorator<G>[];
	}
}
