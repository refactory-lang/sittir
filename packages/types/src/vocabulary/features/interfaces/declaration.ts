import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export namespace Field {
		export interface Signature<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Field<G>> {
			// claimed by t
			readonly $kind: 'declaration.field.signature';
			readonly name: G['slots']['declaration.field.signature']['name'];
		}
	}
	export interface Interface<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by t
		readonly $kind: 'declaration.interface';
		readonly body: G['slots']['declaration.interface']['body'] | G['slots']['declaration.interface']['body'][];
		// rt only
		readonly extends?: G['clause'];
		// rt only
		readonly name: V.Identifier.Type<G>;
		// rt only
	}
	export namespace Interface {
		export interface Trait<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Interface<G>> {
			// claimed by r
			readonly $kind: 'declaration.interface.trait';
			readonly body: G['slots']['declaration.interface.trait']['body'][];
			readonly extends?: V.Clause.Bounds<G>;
			readonly name: V.Identifier.Type<G>;
		}
	}
}
