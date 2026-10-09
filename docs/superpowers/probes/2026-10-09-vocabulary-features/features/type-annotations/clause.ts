import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface MappedType<G extends GrammarContext> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.mapped_type';
		readonly alias?: G['slots']['clause.mapped_type']['alias'];
		readonly name: V.Identifier.Type<G>;
		readonly type: G['slots']['clause.mapped_type']['type'];
	}
}
