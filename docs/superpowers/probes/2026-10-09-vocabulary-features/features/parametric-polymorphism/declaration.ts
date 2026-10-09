import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarContext> {
		readonly typeParameters?: V.Declaration.TypeParameter<G> | V.Declaration.TypeParameter<G>[];
	}
	export namespace Class {
		export interface Abstract<G extends GrammarContext> {
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
	}
	export interface Enum<G extends GrammarContext> {
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
	}
	export interface Extension<G extends GrammarContext> {
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarContext> {
			readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		}
	}
	export interface Function<G extends GrammarContext> {
		readonly typeParameters?: V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G> | (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
	}
	export namespace Function {
		export interface Generator<G extends GrammarContext> {
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export interface Signature<G extends GrammarContext> {
			readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		}
	}
	export interface Interface<G extends GrammarContext> {
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
	}
	export namespace Interface {
		export interface Trait<G extends GrammarContext> {
			readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		}
	}
	export interface Method<G extends GrammarContext> {
		readonly typeParameters?: V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G> | (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
	}
	export namespace Method {
		export interface Signature<G extends GrammarContext> {
			readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarContext> {
				readonly typeParameters?: V.Declaration.TypeParameter<G>[];
			}
		}
		export interface Static<G extends GrammarContext> {
			readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		}
	}
	export namespace Signature {
		export interface Call<G extends GrammarContext> {
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
		export interface Construct<G extends GrammarContext> {
			readonly typeParameters?: V.Declaration.TypeParameter<G>[];
		}
	}
	export interface TypeAlias<G extends GrammarContext> {
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
	}
	export namespace TypeAlias {
		export interface Associated<G extends GrammarContext> {
			readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		}
	}
	export interface TypeParameter<G extends GrammarContext> extends SubKindOf<V.Declaration<G>> {
		readonly $kind: 'declaration.type_parameter';
		readonly const?: boolean;
		readonly default?: G['slots']['declaration.type_parameter']['default'];
		readonly name?: G['identifier'];
		readonly types?: G['type'][];
	}
	export interface Union<G extends GrammarContext> {
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
	}
}
