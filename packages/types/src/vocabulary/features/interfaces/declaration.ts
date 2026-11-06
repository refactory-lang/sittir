import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export namespace Field {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.field.signature'> = 'declaration.field.signature'> extends SubKindOf<V.Declaration.Field<G, K>, 'name' | 'type'> {
			// claimed by t
			readonly $kind: K;
			readonly name: Slot<
				G,
				'declaration.field.signature',
				'name',
				| V.Expression.Any<G>
				| V.Literal.Any<G>
				| V.Identifier<G>
				| string
				| V.Declaration.Module<G>
				| V.Identifier.Any<G>
			>;
		}
	}
	export interface Interface<G extends GrammarMap, K extends Under<'declaration.interface'> = 'declaration.interface'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly body: Slot<
			G,
			'declaration.interface',
			'body',
			| V.Attribute.Any<G>
			| V.Declaration.Any<G>
			| V.Expression.Call.Macro<G>
			| V.Statement.Any<G>
		>[];
		// rt only
		readonly extends?: Slot<
			G,
			'declaration.interface',
			'extends',
			| V.Identifier<G>
			| V.Type.Any<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Clause.Bounds.HigherRanked<G>
			| V.Clause.Bounds.Removed<G>
		>[];
		// rt only
		readonly name: V.Identifier<G>;
		// rt only
	}
	export namespace Interface {
		export interface Trait<G extends GrammarMap, K extends Under<'declaration.interface.trait'> = 'declaration.interface.trait'> extends SubKindOf<V.Declaration.Interface<G, K>, 'body' | 'extends' | 'typeParameters'> {
			// claimed by r
			readonly $kind: K;
			readonly body: Slot<
				G,
				'declaration.interface.trait',
				'body',
				| V.Attribute.Any<G>
				| V.Declaration.Any<G>
				| V.Expression.Call.Macro<G>
				| V.Statement.Any<G>
			>[];
			readonly extends?: Slot<
				G,
				'declaration.interface.trait',
				'extends',
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Clause.Bounds.HigherRanked<G>
				| V.Clause.Bounds.Removed<G>
				| V.Type.Any<G>
			>[];
			readonly name: V.Identifier<G>;
		}
	}
}
