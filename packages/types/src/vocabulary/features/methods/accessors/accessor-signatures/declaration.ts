import type { GrammarMap, Slot } from '../../../../map.ts';
import type { SubKindOf, Under } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Declaration {
	export namespace Member {
		export namespace Property {
			export interface Signature<G extends GrammarMap, K extends Under<'declaration.member.property.signature'> = 'declaration.member.property.signature'> extends SubKindOf<V.Declaration.Member.Property<G, K>> {
				readonly $path: K;
			}
			export namespace Signature {
				export interface Abstract<G extends GrammarMap, K extends Under<'declaration.member.property.signature.abstract'> = 'declaration.member.property.signature.abstract'> extends SubKindOf<V.Declaration.Member.Property.Signature<G, K>> {
					readonly $path: K;
				}
				export namespace Abstract {
					export interface Getter<G extends GrammarMap, K extends Under<'declaration.member.property.signature.abstract.getter'> = 'declaration.member.property.signature.abstract.getter'> extends SubKindOf<V.Declaration.Member.Property.Signature.Abstract<G, K>> {
						// claimed by t
						readonly $path: K;
					}
					export interface Setter<G extends GrammarMap, K extends Under<'declaration.member.property.signature.abstract.setter'> = 'declaration.member.property.signature.abstract.setter'> extends SubKindOf<V.Declaration.Member.Property.Signature.Abstract<G, K>> {
						// claimed by t
						readonly $path: K;
						readonly parameters: Slot<
							G,
							K,
							'parameters',
							| V.Declaration.Parameter<G>
							| V.Declaration.Parameter.Private<G>
							| V.Declaration.Parameter.Protected<G>
							| V.Declaration.Parameter.Public<G>
							| V.Declaration.Parameter.Receiver<G>
						>[];
					}
				}
				export interface Getter<G extends GrammarMap, K extends Under<'declaration.member.property.signature.getter'> = 'declaration.member.property.signature.getter'> extends SubKindOf<V.Declaration.Member.Property.Signature<G, K>> {
					// claimed by t
					readonly $path: K;
				}
				export interface Setter<G extends GrammarMap, K extends Under<'declaration.member.property.signature.setter'> = 'declaration.member.property.signature.setter'> extends SubKindOf<V.Declaration.Member.Property.Signature<G, K>> {
					// claimed by t
					readonly $path: K;
					readonly parameters: Slot<
						G,
						K,
						'parameters',
						| V.Declaration.Parameter<G>
						| V.Declaration.Parameter.Private<G>
						| V.Declaration.Parameter.Protected<G>
						| V.Declaration.Parameter.Public<G>
						| V.Declaration.Parameter.Receiver<G>
					>[];
				}
			}
		}
	}
}
