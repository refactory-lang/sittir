import type { GrammarMap } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Type {
	export interface Abstract<G extends GrammarMap> {
		readonly typeParameters?: (
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter<G>
			| V.Declaration.TypeParameter.Lifetime<G>
			| V.Declaration.TypeParameter.Value<G>
		)[];
	}
	export interface Function<G extends GrammarMap> {
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		// t only
	}
	export namespace Function {
		export interface Constructor<G extends GrammarMap> {
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
	}
}
