import type { GrammarContext } from '../../../context.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Enum<G extends GrammarContext<G>> {
		readonly whereClause?: V.Clause.Where<G>;
		// r only
	}
	export interface Extension<G extends GrammarContext<G>> {
		readonly whereClause?: V.Clause.Where<G>;
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarContext<G>> {
			readonly whereClause?: V.Clause.Where<G>;
		}
	}
	export interface Function<G extends GrammarContext<G>> {
		readonly whereClause?: V.Clause.Where<G>;
		// r only
	}
	export namespace Function {
		export interface Signature<G extends GrammarContext<G>> {
			readonly whereClause?: V.Clause.Where<G>;
			// r only
		}
	}
	export namespace Interface {
		export interface Trait<G extends GrammarContext<G>> {
			readonly whereClause?: V.Clause.Where<G>;
		}
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly whereClause?: V.Clause.Where<G>;
		// rt only
	}
	export namespace Method {
		export interface Signature<G extends GrammarContext<G>> {
			readonly whereClause?: V.Clause.Where<G>;
			// r only
		}
	}
	export interface TypeAlias<G extends GrammarContext<G>> {
		readonly trailingWhereClause?: V.Clause.Where<G>;
		// r only
		readonly whereClause?: V.Clause.Where<G>;
		// r only
	}
	export namespace TypeAlias {
		export interface Associated<G extends GrammarContext<G>> {
			readonly whereClause?: V.Clause.Where<G>;
		}
	}
	export interface TypeParameter<G extends GrammarContext<G>> {
		readonly bounds?: G['slots']['clause.bounds']['bounds'][];
		// rt only
	}
	export interface Union<G extends GrammarContext<G>> {
		readonly whereClause?: V.Clause.Where<G>;
	}
}
