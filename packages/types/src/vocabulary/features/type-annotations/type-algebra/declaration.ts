import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Field {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.field.signature'> = 'declaration.field.signature'> {
			readonly type?: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
	}
	export namespace Method {
		export namespace Signature {
			export interface Abstract<G extends GrammarMap, K extends Under<'declaration.method.signature.abstract'> = 'declaration.method.signature.abstract'> {
				readonly returnType?: Slot<G, K, 'returnType', V.Identifier.Any<G> | V.Type.Any<G>>;
			}
		}
	}
	export interface Property<G extends GrammarMap, K extends Under<'declaration.property'> = 'declaration.property'> {
		readonly type?: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export namespace Property {
		export namespace Signature {
			export namespace Abstract {
				export interface Getter<G extends GrammarMap, K extends Under<'declaration.property.signature.abstract.getter'> = 'declaration.property.signature.abstract.getter'> {
					readonly returnType?: Slot<
						G,
						K,
						'returnType',
						| V.Identifier.Any<G>
						| V.Type.Any<G>
					>;
				}
			}
			export interface Getter<G extends GrammarMap, K extends Under<'declaration.property.signature.getter'> = 'declaration.property.signature.getter'> {
				readonly returnType?: Slot<G, K, 'returnType', V.Identifier.Any<G> | V.Type.Any<G>>;
			}
		}
	}
	export namespace Variable {
		export interface Pattern<G extends GrammarMap, K extends Under<'declaration.variable.pattern'> = 'declaration.variable.pattern'> {
			readonly type?: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
	}
}
