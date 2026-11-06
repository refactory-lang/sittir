import type { GrammarMap, Slot } from '../../../map.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Enum<G extends GrammarMap> {
		readonly whereClause?: V.Clause.Where<G>;
		// r only
	}
	export interface Extension<G extends GrammarMap> {
		readonly whereClause?: V.Clause.Where<G>;
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarMap> {
			readonly whereClause?: V.Clause.Where<G>;
		}
	}
	export interface Function<G extends GrammarMap> {
		readonly whereClause?: V.Clause.Where<G>;
		// r only
	}
	export namespace Function {
		export interface Signature<G extends GrammarMap> {
			readonly whereClause?: V.Clause.Where<G>;
			// r only
		}
	}
	export namespace Interface {
		export interface Trait<G extends GrammarMap> {
			readonly whereClause?: V.Clause.Where<G>;
		}
	}
	export interface Method<G extends GrammarMap> {
		readonly whereClause?: V.Clause.Where<G>;
		// rt only
	}
	export namespace Method {
		export interface Signature<G extends GrammarMap> {
			readonly whereClause?: V.Clause.Where<G>;
			// r only
		}
	}
	export interface TypeAlias<G extends GrammarMap> {
		readonly trailingWhereClause?: V.Clause.Where<G>;
		// r only
		readonly whereClause?: V.Clause.Where<G>;
		// r only
	}
	export namespace TypeAlias {
		export interface Associated<G extends GrammarMap> {
			readonly whereClause?: V.Clause.Where<G>;
		}
	}
	export interface TypeParameter<G extends GrammarMap> {
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
		export interface Parameters<G extends GrammarMap> {
			readonly bounds?: never;
		}
		export interface Value<G extends GrammarMap> {
			readonly bounds?: never;
		}
		export interface Variadic<G extends GrammarMap> {
			readonly bounds?: never;
		}
	}
	export interface Union<G extends GrammarMap> {
		readonly whereClause?: V.Clause.Where<G>;
	}
}
