import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Field<G extends GrammarContext<G>> {
		readonly optional?: boolean;
		readonly optionality?: G['slots']['declaration.field']['optionality'];
	}
	export namespace Field {
		export interface Signature<G extends GrammarContext<G>> {
			readonly optional?: boolean;
		}
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly optional?: boolean;
	}
	export namespace Method {
		export interface Signature<G extends GrammarContext<G>> {
			readonly optional?: boolean;
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarContext<G>> {
				readonly optional?: boolean;
			}
		}
	}
	export namespace Parameter {
		export interface Optional<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Parameter<G>> {
			readonly $kind: 'declaration.parameter.optional';
			readonly name: G['slots']['declaration.parameter.optional']['name'];
			readonly optional?: boolean;
		}
	}
}
