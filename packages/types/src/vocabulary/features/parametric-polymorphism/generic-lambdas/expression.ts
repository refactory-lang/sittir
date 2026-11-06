import type { GrammarMap } from '../../../map.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export interface Lambda<G extends GrammarMap> {
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
	}
}
