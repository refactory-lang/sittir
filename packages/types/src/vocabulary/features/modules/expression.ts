import type { GrammarMap, Text } from '../../map.ts';
export namespace Expression {
	export namespace Call {
		// claimed by t
		export type Import<G extends GrammarMap> = Text<G, 'expression.call.import'>;
	}
}
