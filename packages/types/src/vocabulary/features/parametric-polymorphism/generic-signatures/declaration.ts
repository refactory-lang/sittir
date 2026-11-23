import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Function {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.function.signature'> = 'declaration.function.signature'> {
			readonly typeParameters?: Slot<
				G,
				K,
				'typeParameters',
				| V.Identifier.Metavariable<G>
				| V.Declaration.TypeParameter<G>
				| V.Declaration.TypeParameter.Lifetime<G>
				| V.Declaration.TypeParameter.Value<G>
			>[];
		}
	}
	export namespace Type {
		export interface Interface<G extends GrammarMap, K extends Under<'declaration.type.interface'> = 'declaration.type.interface'> {
			readonly typeParameters?: Slot<
				G,
				K,
				'typeParameters',
				| V.Identifier.Metavariable<G>
				| V.Declaration.TypeParameter<G>
				| V.Declaration.TypeParameter.Lifetime<G>
				| V.Declaration.TypeParameter.Value<G>
			>[];
			// rt only
		}
	}
	export namespace Member {
		export namespace Method {
			export interface Signature<G extends GrammarMap, K extends Under<'declaration.member.method.signature'> = 'declaration.member.method.signature'> {
				readonly typeParameters?: Slot<
					G,
					K,
					'typeParameters',
					| V.Identifier.Metavariable<G>
					| V.Declaration.TypeParameter<G>
					| V.Declaration.TypeParameter.Lifetime<G>
					| V.Declaration.TypeParameter.Value<G>
				>[];
			}
		}
	}
}
