import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Clause<G extends GrammarContext<G>> {
	readonly $kind: 'clause';
}

export namespace Clause {
	export interface Case<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by pt
		readonly $kind: 'clause.case';
	}
	export namespace Case {
		export interface Default<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Case<G>> {
			// claimed by t
			readonly $kind: 'clause.case.default';
		}
	}
	export interface Elif<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by p
		readonly $kind: 'clause.elif';
		readonly condition: G['slots']['clause.elif']['condition'];
		readonly consequence: G['slots']['clause.elif']['consequence'];
	}
	export interface Else<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by prt
		readonly $kind: 'clause.else';
		readonly body: G['slots']['clause.else']['body'];
	}
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
