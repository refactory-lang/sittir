import type { GrammarMap, Text } from '../../../map.ts';
export namespace Expression {
	// claimed by r
	export type Unit<G extends GrammarMap> = Text<G, 'expression.unit'>;
}
