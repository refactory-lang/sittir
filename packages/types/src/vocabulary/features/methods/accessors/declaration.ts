import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Member {
		export interface Property<G extends GrammarMap, K extends Under<'declaration.member.property'> = 'declaration.member.property'> extends SubKindOf<V.Declaration<G, K>> {
			// claimed by pt
			readonly $path: K;
			readonly name: Slot<G, K, 'name', V.Expression.Any<G> | string>;
			readonly value?: Slot<G, K, 'value', V.Expression.Any<G>>;
		}
		export namespace Property {
			export interface Getter<G extends GrammarMap, K extends Under<'declaration.member.property.getter'> = 'declaration.member.property.getter'> extends SubKindOf<V.Declaration.Member.Property<G, K>> {
				// claimed by pt
				readonly $path: K;
				readonly doc?: Slot<G, K, 'doc', V.Literal.String.Any<G>>;
				// p only
				readonly statements?: Slot<G, K, 'statements', V.Statement.Any<G>>[];
				readonly typeParameters?: Slot<G, K, 'typeParameters', V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>>[];
				// p only
			}
			export interface Setter<G extends GrammarMap, K extends Under<'declaration.member.property.setter'> = 'declaration.member.property.setter'> extends SubKindOf<V.Declaration.Member.Property<G, K>> {
				// claimed by pt
				readonly $path: K;
				readonly doc?: Slot<G, K, 'doc', V.Literal.String.Any<G>>;
				// p only
				readonly parameters: Slot<G, K, 'parameters', V.Declaration.Parameter.Any<G> | string>[];
				readonly returnType?: Slot<
					G,
					K,
					'returnType',
					| V.Expression.Any<G>
					| V.Identifier.Any<G>
					| V.Literal.Any<G>
					| V.Pattern.Rest<G>
					| V.Type.Any<G>
				>;
				// p only
				readonly statements?: Slot<G, K, 'statements', V.Statement.Any<G>>[];
				readonly typeParameters?: Slot<G, K, 'typeParameters', V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>>[];
				// p only
			}
		}
	}
}
