import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export namespace Extends {
		export interface Type<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Extends<G>> {
			readonly $kind: 'clause.extends.type';
			readonly types: G['slots']['clause.extends.type']['types'][];
		}
	}
}
