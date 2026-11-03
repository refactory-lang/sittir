import type { GrammarContext } from '../../../context.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export interface Lambda<G extends GrammarContext<G>> {
		readonly typeParameters?: V.Declaration.TypeParameter<G>[];
	}
}
