import type { GrammarContext } from '../../../context.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Enum<G extends GrammarContext> {
		readonly whereClause?: V.Clause.Where<G>;
	}
	export interface Extension<G extends GrammarContext> {
		readonly whereClause?: V.Clause.Where<G>;
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarContext> {
			readonly whereClause?: V.Clause.Where<G>;
		}
	}
	export interface Function<G extends GrammarContext> {
		readonly whereClause?: V.Clause.Where<G>;
	}
	export namespace Function {
		export interface Signature<G extends GrammarContext> {
			readonly whereClause?: V.Clause.Where<G>;
		}
	}
	export namespace Interface {
		export interface Trait<G extends GrammarContext> {
			readonly whereClause?: V.Clause.Where<G>;
		}
	}
	export interface Method<G extends GrammarContext> {
		readonly whereClause?: V.Clause.Where<G>;
	}
	export namespace Method {
		export interface Signature<G extends GrammarContext> {
			readonly whereClause?: V.Clause.Where<G>;
		}
		export interface Static<G extends GrammarContext> {
			readonly whereClause?: V.Clause.Where<G>;
		}
	}
	export interface TypeAlias<G extends GrammarContext> {
		readonly whereClause?: V.Clause.Where<G>;
		readonly trailingWhereClause?: V.Clause.Where<G>;
	}
	export namespace TypeAlias {
		export interface Associated<G extends GrammarContext> {
			readonly whereClause?: V.Clause.Where<G>;
		}
	}
	export interface TypeParameter<G extends GrammarContext> {
		readonly constraint?: G['clause'];
	}
	export interface Union<G extends GrammarContext> {
		readonly whereClause?: V.Clause.Where<G>;
	}
}
