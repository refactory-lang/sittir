import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Enum<G extends GrammarMap, K extends Under<'declaration.enum'> = 'declaration.enum'> {
		readonly typeParameters?: Slot<
			G,
			K,
			'typeParameters',
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter<G>
			| V.Declaration.TypeParameter.Lifetime<G>
			| V.Declaration.TypeParameter.Value<G>
		>[];
		// r only
	}
	export interface Extension<G extends GrammarMap, K extends Under<'declaration.extension'> = 'declaration.extension'> {
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
	export namespace Extension {
		export interface Conformance<G extends GrammarMap, K extends Under<'declaration.extension.conformance'> = 'declaration.extension.conformance'> {
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
	export namespace Interface {
		export interface Trait<G extends GrammarMap, K extends Under<'declaration.interface.trait'> = 'declaration.interface.trait'> {
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
	export namespace TypeAlias {
		export interface Associated<G extends GrammarMap, K extends Under<'declaration.type_alias.associated'> = 'declaration.type_alias.associated'> {
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
	export interface Union<G extends GrammarMap, K extends Under<'declaration.union'> = 'declaration.union'> {
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
