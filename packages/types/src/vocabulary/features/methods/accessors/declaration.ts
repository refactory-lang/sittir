import type { GrammarContext } from '../../../context.ts';
import type { Flag, SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Field<G extends GrammarContext<G>> {
		readonly accessor?: Flag;
		// t only
	}
	export namespace Method {
		export interface Getter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			// claimed by t
			readonly $kind: 'declaration.method.getter';
		}
		export interface Setter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			// claimed by t
			readonly $kind: 'declaration.method.setter';
		}
		export namespace Signature {
			export interface Getter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method.Signature<G>> {
				// claimed by t
				readonly $kind: 'declaration.method.signature.getter';
			}
			export interface Setter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method.Signature<G>> {
				// claimed by t
				readonly $kind: 'declaration.method.signature.setter';
			}
			export namespace Abstract {
				export interface Getter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method.Signature.Abstract<G>> {
					// claimed by t
					readonly $kind: 'declaration.method.signature.abstract.getter';
				}
				export interface Setter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method.Signature.Abstract<G>> {
					// claimed by t
					readonly $kind: 'declaration.method.signature.abstract.setter';
				}
			}
		}
	}
}
