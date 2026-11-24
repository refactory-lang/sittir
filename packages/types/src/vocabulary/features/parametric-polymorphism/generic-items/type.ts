import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Type {
	export type AnyWithTypeArgument<G extends GrammarMap> = V.Type.Any<G> | V.Element.TypeArgument<G> | V.Element.TypeBinding<G> | V.Literal.Any<G> | V.Statement.Block<G>;
	export interface Abstract<G extends GrammarMap, K extends Under<'type.abstract'> = 'type.abstract'> {
		readonly typeParameters?: Slot<
			G,
			K,
			'typeParameters',
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter<G>
			| V.Declaration.TypeParameter.Lifetime<G>
			| V.Declaration.TypeParameter.Value<G>
		>[];
	}
}
