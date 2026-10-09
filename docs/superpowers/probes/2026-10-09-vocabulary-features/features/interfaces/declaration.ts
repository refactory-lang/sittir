import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export namespace Field {
		export interface Signature<G extends GrammarContext> extends SubKindOf<V.Declaration.Field<G>> {
			readonly $kind: 'declaration.field.signature';
			readonly name: G['slots']['declaration.field.signature']['name'];
			readonly static?: boolean;
		}
	}
	export interface Interface<G extends GrammarContext> extends SubKindOf<V.Declaration<G>> {
		readonly $kind: 'declaration.interface';
		readonly body: G['slots']['declaration.interface']['body'] | G['slots']['declaration.interface']['body'][];
		readonly extends?: G['clause'];
		readonly name: V.Identifier.Type<G>;
	}
	export namespace Interface {
		export interface Trait<G extends GrammarContext> extends SubKindOf<V.Declaration.Interface<G>> {
			readonly $kind: 'declaration.interface.trait';
			readonly body: G['slots']['declaration.interface.trait']['body'][];
			readonly extends?: V.Clause.Bounds<G>;
			readonly name: V.Identifier.Type<G>;
		}
	}
}
