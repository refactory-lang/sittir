import type { GrammarContext } from '../../context.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarContext<G>> {
		readonly typeParameters?: V.Declaration.TypeParameter<G> | V.Declaration.TypeParameter<G>[];
	}
	export interface Enum<G extends GrammarContext<G>> {
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		// r only
	}
	export interface Extension<G extends GrammarContext<G>> {
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarContext<G>> {
			readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		}
	}
	export interface Function<G extends GrammarContext<G>> {
		readonly typeParameters?:
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter.Any<G>
			| (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
	}
	export namespace Function {
		export interface Signature<G extends GrammarContext<G>> {
			readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		}
	}
	export interface Interface<G extends GrammarContext<G>> {
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		// rt only
	}
	export namespace Interface {
		export interface Trait<G extends GrammarContext<G>> {
			readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		}
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly typeParameters?:
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter.Any<G>
			| (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
	}
	export namespace Method {
		export interface Signature<G extends GrammarContext<G>> {
			readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarContext<G>> {
				readonly typeParameters?: V.Declaration.TypeParameter<G>[];
			}
		}
	}
	export namespace Signature {
		export interface Call<G extends GrammarContext<G>> {
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export interface Construct<G extends GrammarContext<G>> {
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
	}
	export interface TypeAlias<G extends GrammarContext<G>> {
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		// rt only
	}
	export namespace TypeAlias {
		export interface Associated<G extends GrammarContext<G>> {
			readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		}
	}
	export interface TypeParameter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by prt
		readonly $kind: 'declaration.type_parameter';
		readonly const?: Flag;
		// t only
		readonly default?: G['slots']['declaration.type_parameter']['default'];
		// rt only
		readonly name?: G['identifier'];
		// rt only
		readonly types?: G['type'][];
		// p only
	}
	export interface Union<G extends GrammarContext<G>> {
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
	}
}
