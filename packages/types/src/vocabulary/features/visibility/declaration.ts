import type { GrammarMap } from '../../map.ts';
import type { RefinedBy, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export namespace Field {
		export interface Private<G extends GrammarMap, K extends Under<'declaration.field.private'> = 'declaration.field.private'> extends RefinedBy<V.Declaration.Field<G, K>, V.Modifier.Visibility.Private<G>> {
			// claimed by rt
			readonly $path: K;
		}
		export interface Public<G extends GrammarMap, K extends Under<'declaration.field.public'> = 'declaration.field.public'> extends RefinedBy<V.Declaration.Field<G, K>, V.Modifier.Visibility.Public<G>> {
			// claimed by rt
			readonly $path: K;
		}
	}
	export namespace Method {
		export interface Private<G extends GrammarMap, K extends Under<'declaration.method.private'> = 'declaration.method.private'> extends RefinedBy<V.Declaration.Method<G, K>, V.Modifier.Visibility.Private<G>> {
			// claimed by rt
			readonly $path: K;
		}
		export interface Public<G extends GrammarMap, K extends Under<'declaration.method.public'> = 'declaration.method.public'> extends RefinedBy<V.Declaration.Method<G, K>, V.Modifier.Visibility.Public<G>> {
			// claimed by rt
			readonly $path: K;
		}
		export namespace Signature {
			export interface Private<G extends GrammarMap, K extends Under<'declaration.method.signature.private'> = 'declaration.method.signature.private'> extends RefinedBy<V.Declaration.Method.Signature<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by rt
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'declaration.method.signature.public'> = 'declaration.method.signature.public'> extends RefinedBy<V.Declaration.Method.Signature<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by rt
				readonly $path: K;
			}
		}
	}
}
