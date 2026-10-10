import type { GrammarContext } from '../../context.ts';
import type * as V from '../../index.ts';
export namespace Type {
	export interface Abstract<G extends GrammarContext<G>> {
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
	}
	export interface Function<G extends GrammarContext<G>> {
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
	}
	export namespace Function {
		export interface Constructor<G extends GrammarContext<G>> {
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
	}
}
