import type { GrammarContext } from '../../../../context.ts';
import type { SubKindOf } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Clause {
	export interface Extends<G extends GrammarContext> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.extends';
		readonly extendsClauseSingles?: G['slots']['clause.extends']['extendsClauseSingles'][];
	}
}
