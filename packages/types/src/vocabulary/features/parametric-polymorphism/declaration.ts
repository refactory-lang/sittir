import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export namespace Type {
		export interface Class<G extends GrammarMap, K extends Under<'declaration.type.class'> = 'declaration.type.class'> {
		}
	}
	export namespace Member {
		export interface Constructor<G extends GrammarMap, K extends Under<'declaration.member.constructor'> = 'declaration.member.constructor'> {
		}
	}
	export namespace Type {
		export interface Enum<G extends GrammarMap, K extends Under<'declaration.type.enum'> = 'declaration.type.enum'> {
		}
	}
	export interface Extension<G extends GrammarMap, K extends Under<'declaration.extension'> = 'declaration.extension'> {
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarMap, K extends Under<'declaration.extension.conformance'> = 'declaration.extension.conformance'> {
		}
	}
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
		readonly typeParameters?:
			Slot<
			G,
			K,
			'typeParameters',
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter.Any<G>
		> | Slot<
			G,
			K,
			'typeParameters',
			| V.Identifier.Metavariable<G>
			| V.Declaration.TypeParameter.Any<G>
		>[];
	}
	export namespace Function {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.function.signature'> = 'declaration.function.signature'> {
		}
	}
	export namespace Type {
		export interface Interface<G extends GrammarMap, K extends Under<'declaration.type.interface'> = 'declaration.type.interface'> {
		}
		export namespace Interface {
			export interface Trait<G extends GrammarMap, K extends Under<'declaration.type.interface.trait'> = 'declaration.type.interface.trait'> {
			}
		}
	}
	export namespace Member {
		export interface Method<G extends GrammarMap, K extends Under<'declaration.member.method'> = 'declaration.member.method'> {
			readonly typeParameters?:
				Slot<
				G,
				K,
				'typeParameters',
				| V.Identifier.Metavariable<G>
				| V.Declaration.TypeParameter.Any<G>
			> | Slot<
				G,
				K,
				'typeParameters',
				| V.Identifier.Metavariable<G>
				| V.Declaration.TypeParameter.Any<G>
			>[];
		}
		export namespace Method {
			export interface Signature<G extends GrammarMap, K extends Under<'declaration.member.method.signature'> = 'declaration.member.method.signature'> {
			}
			export namespace Signature {
				export interface Abstract<G extends GrammarMap, K extends Under<'declaration.member.method.signature.abstract'> = 'declaration.member.method.signature.abstract'> {
				}
			}
		}
		export namespace Signature {
			export interface Call<G extends GrammarMap, K extends Under<'declaration.member.signature.call'> = 'declaration.member.signature.call'> {
			}
			export interface Construct<G extends GrammarMap, K extends Under<'declaration.member.signature.construct'> = 'declaration.member.signature.construct'> {
			}
		}
	}
	export namespace Type {
		export interface TypeAlias<G extends GrammarMap, K extends Under<'declaration.type.type_alias'> = 'declaration.type.type_alias'> {
			readonly typeParameters?: Slot<
				G,
				K,
				'typeParameters',
				| V.Identifier.Metavariable<G>
				| V.Declaration.TypeParameter.Any<G>
			>[];
		}
		export namespace TypeAlias {
			export interface Associated<G extends GrammarMap, K extends Under<'declaration.type.type_alias.associated'> = 'declaration.type.type_alias.associated'> {
			}
		}
	}
	export interface TypeParameter<G extends GrammarMap, K extends Under<'declaration.type_parameter'> = 'declaration.type_parameter'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly const?: Flag;
		// t only
		readonly default?: Slot<
			G,
			K,
			'default',
			| V.Clause.Any<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Block<G>
			| V.Type.Any<G>
		>;
		// rt only
		readonly name?: Slot<G, K, 'name', V.Identifier.Any<G>>;
	}
	export namespace Type {
		export interface Union<G extends GrammarMap, K extends Under<'declaration.type.union'> = 'declaration.type.union'> {
		}
	}
}
