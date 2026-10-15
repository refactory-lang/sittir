import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Type {
	export namespace Primitive {
		export interface Character<G extends GrammarContext<G>> extends SubKindOf<V.Type.Primitive<G>> {
			// claimed by r
			readonly $kind: 'type.primitive.character';
		}
	}
}
