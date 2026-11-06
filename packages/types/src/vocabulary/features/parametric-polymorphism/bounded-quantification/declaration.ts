import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Enum<G extends GrammarMap, K extends Under<'declaration.enum'> = 'declaration.enum'> {
		readonly whereClause?: V.Clause.Where<G>;
		// r only
	}
	export interface Extension<G extends GrammarMap, K extends Under<'declaration.extension'> = 'declaration.extension'> {
		readonly whereClause?: V.Clause.Where<G>;
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarMap, K extends Under<'declaration.extension.conformance'> = 'declaration.extension.conformance'> {
			readonly whereClause?: V.Clause.Where<G>;
		}
	}
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
		readonly whereClause?: V.Clause.Where<G>;
		// r only
	}
	export namespace Function {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.function.signature'> = 'declaration.function.signature'> {
			readonly whereClause?: V.Clause.Where<G>;
			// r only
		}
	}
	export namespace Interface {
		export interface Trait<G extends GrammarMap, K extends Under<'declaration.interface.trait'> = 'declaration.interface.trait'> {
			readonly whereClause?: V.Clause.Where<G>;
		}
	}
	export interface Method<G extends GrammarMap, K extends Under<'declaration.method'> = 'declaration.method'> {
		readonly whereClause?: V.Clause.Where<G>;
		// rt only
	}
	export namespace Method {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.method.signature'> = 'declaration.method.signature'> {
			readonly whereClause?: V.Clause.Where<G>;
			// r only
		}
	}
	export interface TypeAlias<G extends GrammarMap, K extends Under<'declaration.type_alias'> = 'declaration.type_alias'> {
		readonly trailingWhereClause?: V.Clause.Where<G>;
		// r only
		readonly whereClause?: V.Clause.Where<G>;
		// r only
	}
	export namespace TypeAlias {
		export interface Associated<G extends GrammarMap, K extends Under<'declaration.type_alias.associated'> = 'declaration.type_alias.associated'> {
			readonly whereClause?: V.Clause.Where<G>;
		}
	}
	export interface TypeParameter<G extends GrammarMap, K extends Under<'declaration.type_parameter'> = 'declaration.type_parameter'> {
		readonly bounds?: Slot<
			G,
			'declaration.type_parameter',
			'bounds',
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Clause.Bounds.HigherRanked<G>
			| V.Clause.Bounds.Removed<G>
			| V.Type.Any<G>
		>[];
	}
	export namespace TypeParameter {
		export interface Parameters<G extends GrammarMap, K extends Under<'declaration.type_parameter.parameters'> = 'declaration.type_parameter.parameters'> {
			readonly bounds?: never;
		}
		export interface Value<G extends GrammarMap, K extends Under<'declaration.type_parameter.value'> = 'declaration.type_parameter.value'> {
			readonly bounds?: never;
		}
		export interface Variadic<G extends GrammarMap, K extends Under<'declaration.type_parameter.variadic'> = 'declaration.type_parameter.variadic'> {
			readonly bounds?: never;
		}
	}
	export interface Union<G extends GrammarMap, K extends Under<'declaration.union'> = 'declaration.union'> {
		readonly whereClause?: V.Clause.Where<G>;
	}
}
