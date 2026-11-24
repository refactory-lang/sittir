import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Member {
		export namespace Field {
			export interface Signature<G extends GrammarMap, K extends Under<'declaration.member.field.signature'> = 'declaration.member.field.signature'> {
				readonly type?: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
			}
		}
		export namespace Method {
			export namespace Signature {
				export interface Abstract<G extends GrammarMap, K extends Under<'declaration.member.method.signature.abstract'> = 'declaration.member.method.signature.abstract'> {
					readonly returnType?: Slot<G, K, 'returnType', V.Identifier.Any<G> | V.Type.Any<G>>;
				}
			}
		}
	}
	export namespace Variable {
		export interface Pattern<G extends GrammarMap, K extends Under<'declaration.variable.pattern'> = 'declaration.variable.pattern'> {
			readonly type?: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
	}
}
