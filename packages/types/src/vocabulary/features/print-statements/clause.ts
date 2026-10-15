import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Print<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.print';
		readonly expression: G['slots']['clause.print']['expression'];
		// p only
	}
	export namespace Print {
		export interface Chevron<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Print<G>> {
			// claimed by p
			readonly $kind: 'clause.print.chevron';
			readonly expression: G['slots']['clause.print.chevron']['expression'];
		}
	}
}
