import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Property<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by t
		readonly $kind: 'declaration.property';
		readonly name: G['slots']['declaration.property']['name'];
		readonly value?: G['slots']['declaration.property']['value'];
	}
	export namespace Property {
		export interface Getter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Property<G>> {
			// claimed by t
			readonly $kind: 'declaration.property.getter';
			readonly body: V.Statement.Block<G>;
			readonly parameters: V.Declaration.Parameter.Any<G>[];
		}
		export interface Setter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Property<G>> {
			// claimed by t
			readonly $kind: 'declaration.property.setter';
			readonly body: V.Statement.Block<G>;
			readonly parameters: V.Declaration.Parameter.Any<G>[];
		}
		export interface Signature<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Property<G>> {
			readonly $kind: 'declaration.property.signature';
			readonly parameters: V.Declaration.Parameter.Any<G>[];
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Property.Signature<G>> {
				readonly $kind: 'declaration.property.signature.abstract';
			}
			export namespace Abstract {
				export interface Getter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Property.Signature.Abstract<G>> {
					// claimed by t
					readonly $kind: 'declaration.property.signature.abstract.getter';
				}
				export interface Setter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Property.Signature.Abstract<G>> {
					// claimed by t
					readonly $kind: 'declaration.property.signature.abstract.setter';
				}
			}
			export interface Getter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Property.Signature<G>> {
				// claimed by t
				readonly $kind: 'declaration.property.signature.getter';
			}
			export interface Setter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Property.Signature<G>> {
				// claimed by t
				readonly $kind: 'declaration.property.signature.setter';
			}
		}
	}
}
