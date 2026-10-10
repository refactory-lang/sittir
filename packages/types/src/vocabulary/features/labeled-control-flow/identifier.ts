import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Identifier {
	export interface Label<G extends GrammarContext<G>> extends SubKindOf<V.Identifier<G>> {
		readonly $kind: 'identifier.label';
		readonly content?: G['identifier'];
		readonly name?: G['identifier'];
	}
}
