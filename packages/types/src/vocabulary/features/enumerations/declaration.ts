import type { GrammarContext } from '../../context.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Enum<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by rt
		readonly $kind: 'declaration.enum';
		readonly body: V.Declaration.EnumMember<G> | V.Declaration.EnumMember<G>[];
		readonly const?: Flag;
		// t only
		readonly name: G['identifier'];
	}
	export interface EnumMember<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by rt
		readonly $kind: 'declaration.enum_member';
		readonly body?: G['slots']['declaration.enum_member']['body'][];
		// r only
		readonly name: G['slots']['declaration.enum_member']['name'];
		readonly value?: G['slots']['declaration.enum_member']['value'];
	}
}
