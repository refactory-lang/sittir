import type { GrammarContext } from '../../../../context.ts';
import type { SubKindOf } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Declaration {
	export namespace Class {
		export interface Abstract<G extends GrammarContext> extends SubKindOf<V.Declaration.Class<G>> {
			readonly $kind: 'declaration.class.abstract';
			readonly abstract?: boolean;
			readonly body: G['slots']['declaration.class.abstract']['body'][];
			readonly name: V.Identifier.Type<G>;
		}
	}
	export interface Field<G extends GrammarContext> {
		readonly abstract?: boolean;
	}
	export namespace Method {
		export namespace Signature {
			export interface Abstract<G extends GrammarContext> extends SubKindOf<V.Declaration.Method.Signature<G>> {
				readonly $kind: 'declaration.method.signature.abstract';
				readonly abstract?: boolean;
				readonly accessorKind?: G['slots']['declaration.method.signature.abstract']['accessorKind'];
				readonly name: G['slots']['declaration.method.signature.abstract']['name'];
				readonly parameters: V.Declaration.Parameter.Any<G>[];
			}
		}
	}
	export namespace Signature {
		export interface Construct<G extends GrammarContext> {
			readonly abstract?: boolean;
		}
	}
}
