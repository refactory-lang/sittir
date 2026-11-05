import type { GrammarContext } from '../../context.ts';
export namespace Type {
	export namespace Primitive {
		// claimed by r
		export type Character<G extends GrammarContext<G>> = G['texts']['type.primitive.character'];
	}
}
