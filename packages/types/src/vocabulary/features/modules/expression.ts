import type { GrammarContext } from '../../context.ts';
export namespace Expression {
	export namespace Call {
		// claimed by t
		export type Import<G extends GrammarContext<G>> = G['texts']['expression.call.import'];
	}
}
