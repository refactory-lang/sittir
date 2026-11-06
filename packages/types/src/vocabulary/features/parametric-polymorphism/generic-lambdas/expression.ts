import type { GrammarMap } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export interface Lambda<G extends GrammarMap, K extends Under<'expression.lambda'> = 'expression.lambda'> {
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
	}
}
