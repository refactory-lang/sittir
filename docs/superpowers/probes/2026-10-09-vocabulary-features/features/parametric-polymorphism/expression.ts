import type { GrammarContext } from '../../context.ts';
import type * as V from '../../index.ts';
export namespace Expression {
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
}
