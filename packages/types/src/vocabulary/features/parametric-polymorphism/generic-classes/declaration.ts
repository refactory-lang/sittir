import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Type {
		export interface Class<G extends GrammarMap, K extends Under<'declaration.type.class'> = 'declaration.type.class'> {
			readonly typeParameters?:
				Slot<
				G,
				K,
				'typeParameters',
				| V.Declaration.TypeParameter<G>
				| V.Declaration.TypeParameter.Parameters<G>
				| V.Declaration.TypeParameter.Variadic<G>
			> | Slot<
				G,
				K,
				'typeParameters',
				| V.Declaration.TypeParameter<G>
				| V.Declaration.TypeParameter.Parameters<G>
				| V.Declaration.TypeParameter.Variadic<G>
			>[];
		}
	}
}
