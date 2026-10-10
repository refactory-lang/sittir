import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface TypeAlias<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		readonly $kind: 'declaration.type_alias';
		readonly left?: G['type'];
		readonly name?: V.Identifier.Type<G>;
		readonly right?: G['type'];
		readonly value?: G['slots']['declaration.type_alias']['value'];
	}
}
