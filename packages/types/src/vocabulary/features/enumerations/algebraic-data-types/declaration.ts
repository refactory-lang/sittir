import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace EnumMember {
		export interface Struct<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.EnumMember<G>> {
			readonly $kind: 'declaration.enum_member.struct';
			readonly body?: G['slots']['declaration.enum_member.struct']['body'][];
			readonly name: G['identifier'];
			readonly value?: G['slots']['declaration.enum_member.struct']['value'];
		}
		export interface Tuple<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.EnumMember<G>> {
			readonly $kind: 'declaration.enum_member.tuple';
			readonly body?: G['slots']['declaration.enum_member.tuple']['body'][];
			readonly name: G['identifier'];
			readonly value?: G['slots']['declaration.enum_member.tuple']['value'];
		}
	}
}
