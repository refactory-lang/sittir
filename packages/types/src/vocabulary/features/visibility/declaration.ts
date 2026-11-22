import type { GrammarMap } from '../../map.ts';
import type { RefinedBy, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export namespace Member {
		export namespace Field {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.member.field.private'> = 'declaration.member.field.private'> extends RefinedBy<V.Declaration.Member.Field<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by rt
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.member.field.public'> = 'declaration.member.field.public'> extends RefinedBy<V.Declaration.Member.Field<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by rt
				readonly $path: K;
			}
		}
		export namespace Method {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.member.method.private'> = 'declaration.member.method.private'> extends RefinedBy<V.Declaration.Member.Method<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by rt
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.member.method.public'> = 'declaration.member.method.public'> extends RefinedBy<V.Declaration.Member.Method<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by rt
				readonly $path: K;
			}
			export namespace Signature {
				export interface Private<G extends GrammarMap, K extends Under<'declaration.member.method.signature.private'> = 'declaration.member.method.signature.private'> extends RefinedBy<V.Declaration.Member.Method.Signature<G, K>, V.Modifier.Visibility.Private<G>> {
					// claimed by rt
					readonly $path: K;
				}
				export interface Public<G extends GrammarMap, K extends Under<'declaration.member.method.signature.public'> = 'declaration.member.method.signature.public'> extends RefinedBy<V.Declaration.Member.Method.Signature<G, K>, V.Modifier.Visibility.Public<G>> {
					// claimed by rt
					readonly $path: K;
				}
			}
		}
	}
}
