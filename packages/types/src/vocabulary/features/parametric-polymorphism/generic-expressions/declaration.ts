import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Member {
		export namespace Method {
			export namespace Signature {
				export interface Abstract<G extends GrammarMap, K extends Under<'declaration.member.method.signature.abstract'> = 'declaration.member.method.signature.abstract'> {
					readonly typeParameters?: Slot<G, K, 'typeParameters', V.Declaration.TypeParameter<G>>[];
				}
			}
		}
		export namespace Signature {
			export interface Call<G extends GrammarMap, K extends Under<'declaration.member.signature.call'> = 'declaration.member.signature.call'> {
				readonly typeParameters?: Slot<G, K, 'typeParameters', V.Declaration.TypeParameter<G>>[];
			}
			export interface Construct<G extends GrammarMap, K extends Under<'declaration.member.signature.construct'> = 'declaration.member.signature.construct'> {
				readonly typeParameters?: Slot<G, K, 'typeParameters', V.Declaration.TypeParameter<G>>[];
			}
		}
	}
}
