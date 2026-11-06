import type { GrammarMap } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Type {
	export interface Abstract<G extends GrammarMap, K extends Under<'type.abstract'> = 'type.abstract'> {
		readonly typeParameters?: (
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter<G>
			| V.Declaration.TypeParameter.Lifetime<G>
			| V.Declaration.TypeParameter.Value<G>
		)[];
	}
	export interface Function<G extends GrammarMap, K extends Under<'type.function'> = 'type.function'> {
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		// t only
	}
	export namespace Function {
		export interface Constructor<G extends GrammarMap, K extends Under<'type.function.constructor'> = 'type.function.constructor'> {
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
	}
}
