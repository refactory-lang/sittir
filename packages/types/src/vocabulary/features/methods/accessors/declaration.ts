import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Property<G extends GrammarMap, K extends Under<'declaration.property'> = 'declaration.property'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly name: Slot<
			G,
			'declaration.property',
			'name',
			| V.Expression.Any<G>
			| V.Literal.Any<G>
			| V.Identifier<G>
			| string
			| V.Declaration.Module<G>
			| V.Identifier.Any<G>
		>;
		readonly value?: Slot<
			G,
			'declaration.property',
			'value',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
		>;
	}
	export namespace Property {
		export interface Getter<G extends GrammarMap, K extends Under<'declaration.property.getter'> = 'declaration.property.getter'> extends SubKindOf<V.Declaration.Property<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly body: V.Statement.Block<G>;
			readonly parameters: V.Declaration.Parameter.Any<G>[];
		}
		export interface Setter<G extends GrammarMap, K extends Under<'declaration.property.setter'> = 'declaration.property.setter'> extends SubKindOf<V.Declaration.Property<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly body: V.Statement.Block<G>;
			readonly parameters: (
				| V.Declaration.Parameter<G>
				| V.Declaration.Parameter.Private<G>
				| V.Declaration.Parameter.Protected<G>
				| V.Declaration.Parameter.Public<G>
			)[];
		}
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.property.signature'> = 'declaration.property.signature'> extends SubKindOf<V.Declaration.Property<G, K>> {
			readonly $kind: K;
			readonly parameters: (
				| V.Declaration.Parameter<G>
				| V.Declaration.Parameter.Private<G>
				| V.Declaration.Parameter.Protected<G>
				| V.Declaration.Parameter.Public<G>
			)[];
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarMap, K extends Under<'declaration.property.signature.abstract'> = 'declaration.property.signature.abstract'> extends SubKindOf<V.Declaration.Property.Signature<G, K>> {
				readonly $kind: K;
			}
			export namespace Abstract {
				export interface Getter<G extends GrammarMap, K extends Under<'declaration.property.signature.abstract.getter'> = 'declaration.property.signature.abstract.getter'> extends SubKindOf<V.Declaration.Property.Signature.Abstract<G, K>> {
					// claimed by t
					readonly $kind: K;
				}
				export interface Setter<G extends GrammarMap, K extends Under<'declaration.property.signature.abstract.setter'> = 'declaration.property.signature.abstract.setter'> extends SubKindOf<V.Declaration.Property.Signature.Abstract<G, K>> {
					// claimed by t
					readonly $kind: K;
				}
			}
			export interface Getter<G extends GrammarMap, K extends Under<'declaration.property.signature.getter'> = 'declaration.property.signature.getter'> extends SubKindOf<V.Declaration.Property.Signature<G, K>> {
				// claimed by t
				readonly $kind: K;
			}
			export interface Setter<G extends GrammarMap, K extends Under<'declaration.property.signature.setter'> = 'declaration.property.signature.setter'> extends SubKindOf<V.Declaration.Property.Signature<G, K>> {
				// claimed by t
				readonly $kind: K;
			}
		}
	}
}
