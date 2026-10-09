import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export interface Class<G extends GrammarContext> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.class';
		readonly body: G['slots']['expression.class']['body'][];
		readonly decorators?: V.Attribute.Decorator<G>[];
		readonly name?: V.Identifier.Type<G>;
	}
}
