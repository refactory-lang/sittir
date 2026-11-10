import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export interface Call<G extends GrammarMap, K extends Under<'expression.call'> = 'expression.call'> {
		readonly typeArguments?: Slot<G, K, 'typeArguments', V.Identifier.Any<G> | V.Type.Any<G>>[];
		// t only
	}
	export namespace Call {
		export interface Construct<G extends GrammarMap, K extends Under<'expression.call.construct'> = 'expression.call.construct'> {
			readonly typeArguments?: Slot<G, K, 'typeArguments', V.Identifier.Any<G> | V.Type.Any<G>>[];
		}
		export interface Member<G extends GrammarMap, K extends Under<'expression.call.member'> = 'expression.call.member'> {
			readonly typeArguments?: Slot<G, K, 'typeArguments', V.Identifier.Any<G> | V.Type.Any<G>>[];
			// t only
		}
	}
	export interface Class<G extends GrammarMap, K extends Under<'expression.class'> = 'expression.class'> {
		readonly typeParameters?: Slot<G, K, 'typeParameters', V.Declaration.TypeParameter<G>>[];
	}
	export interface Function<G extends GrammarMap, K extends Under<'expression.function'> = 'expression.function'> {
		readonly typeParameters?: Slot<G, K, 'typeParameters', V.Declaration.TypeParameter<G>>[];
	}
}
