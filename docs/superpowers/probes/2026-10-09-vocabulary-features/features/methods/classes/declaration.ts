import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarContext> extends SubKindOf<V.Declaration<G>> {
		readonly $kind: 'declaration.class';
		readonly body: G['slots']['declaration.class']['body'] | G['slots']['declaration.class']['body'][];
		readonly decorators?: V.Attribute.Decorator<G>[];
		readonly doc?: V.Literal.String<G>;
		readonly name: G['identifier'];
	}
	export namespace Class {
		export interface Abstract<G extends GrammarContext> extends SubKindOf<V.Declaration.Class<G>> {
			readonly $kind: 'declaration.class.abstract';
			readonly abstract?: boolean;
			readonly body: G['slots']['declaration.class.abstract']['body'][];
			readonly decorators?: V.Attribute.Decorator<G>[];
			readonly name: V.Identifier.Type<G>;
		}
	}
}
