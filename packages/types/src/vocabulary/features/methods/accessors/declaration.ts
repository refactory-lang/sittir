import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Property<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		// claimed by t
		readonly $kind: 'declaration.property';
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
		export interface Getter<G extends GrammarMap> extends SubKindOf<V.Declaration.Property<G>> {
			// claimed by t
			readonly $kind: 'declaration.property.getter';
			readonly body: V.Statement.Block<G>;
			readonly parameters: V.Declaration.Parameter.Any<G>[];
		}
		export interface Setter<G extends GrammarMap> extends SubKindOf<V.Declaration.Property<G>> {
			// claimed by t
			readonly $kind: 'declaration.property.setter';
			readonly body: V.Statement.Block<G>;
			readonly parameters: (
				| V.Declaration.Parameter<G>
				| V.Declaration.Parameter.Private<G>
				| V.Declaration.Parameter.Protected<G>
				| V.Declaration.Parameter.Public<G>
			)[];
		}
		export interface Signature<G extends GrammarMap> extends SubKindOf<V.Declaration.Property<G>> {
			readonly $kind: 'declaration.property.signature';
			readonly parameters: (
				| V.Declaration.Parameter<G>
				| V.Declaration.Parameter.Private<G>
				| V.Declaration.Parameter.Protected<G>
				| V.Declaration.Parameter.Public<G>
			)[];
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarMap> extends SubKindOf<V.Declaration.Property.Signature<G>> {
				readonly $kind: 'declaration.property.signature.abstract';
			}
			export namespace Abstract {
				export interface Getter<G extends GrammarMap> extends SubKindOf<V.Declaration.Property.Signature.Abstract<G>> {
					// claimed by t
					readonly $kind: 'declaration.property.signature.abstract.getter';
				}
				export interface Setter<G extends GrammarMap> extends SubKindOf<V.Declaration.Property.Signature.Abstract<G>> {
					// claimed by t
					readonly $kind: 'declaration.property.signature.abstract.setter';
				}
			}
			export interface Getter<G extends GrammarMap> extends SubKindOf<V.Declaration.Property.Signature<G>> {
				// claimed by t
				readonly $kind: 'declaration.property.signature.getter';
			}
			export interface Setter<G extends GrammarMap> extends SubKindOf<V.Declaration.Property.Signature<G>> {
				// claimed by t
				readonly $kind: 'declaration.property.signature.setter';
			}
		}
	}
}
