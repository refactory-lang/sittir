import type { GrammarContext } from '../../../../context.ts';
import type { Flag, SubKindOf } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarContext<G>> {
		readonly abstract?: Flag;
		// t only
	}
	export interface Field<G extends GrammarContext<G>> {
		readonly abstract?: Flag;
		// t only
	}
	export namespace Method {
		export namespace Signature {
			export interface Abstract<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method.Signature<G>> {
				// claimed by t
				readonly $kind: 'declaration.method.signature.abstract';
				readonly accessorKind?: G['slots']['declaration.method.signature.abstract']['accessorKind'];
				readonly name: G['slots']['declaration.method.signature.abstract']['name'];
				readonly parameters: V.Declaration.Parameter.Any<G>[];
			}
		}
	}
	export namespace Signature {
		export interface Construct<G extends GrammarContext<G>> {
			readonly abstract?: Flag;
		}
	}
}
