import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Call<G extends GrammarContext<G>> {
		readonly typeArguments?: G['slots']['expression.call']['typeArguments'][];
		// t only
	}
	export namespace Call {
		export interface Construct<G extends GrammarContext<G>> {
			readonly typeArguments?: G['slots']['expression.call.construct']['typeArguments'][];
		}
		export interface Member<G extends GrammarContext<G>> {
			readonly typeArguments?: G['slots']['expression.call.member']['typeArguments'][];
			// t only
		}
	}
	export interface Class<G extends GrammarContext<G>> {
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
	}
	export interface Function<G extends GrammarContext<G>> {
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
	}
	export interface Instantiation<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by rt
		readonly $kind: 'expression.instantiation';
		readonly expression?: G['slots']['expression.instantiation']['expression'];
		// t only
		readonly function?: G['slots']['expression.instantiation']['function'];
		// r only
		readonly typeArguments: G['slots']['expression.instantiation']['typeArguments'][];
	}
}
