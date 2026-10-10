import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Call<G extends GrammarContext> {
		readonly typeArguments?: G['slots']['expression.call']['typeArguments'][];
	}
	export namespace Call {
		export interface Member<G extends GrammarContext> {
			readonly typeArguments?: G['slots']['expression.call.member']['typeArguments'][];
		}
		export interface New<G extends GrammarContext> {
			readonly typeArguments?: G['slots']['expression.call.new']['typeArguments'][];
		}
	}
	export interface Class<G extends GrammarContext> {
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
	}
	export interface Function<G extends GrammarContext> {
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
	}
	export namespace Function {
		export interface Generator<G extends GrammarContext> {
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
	}
	export interface Instantiation<G extends GrammarContext> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.instantiation';
		readonly expression?: G['slots']['expression.instantiation']['expression'];
		readonly function?: G['slots']['expression.instantiation']['function'];
		readonly typeArguments: G['slots']['expression.instantiation']['typeArguments'][];
	}
}
