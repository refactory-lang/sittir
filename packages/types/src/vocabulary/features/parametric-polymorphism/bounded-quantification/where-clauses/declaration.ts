import type { GrammarMap, Slot } from '../../../../map.ts';
import type { Under } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Declaration {
	export namespace Type {
		export interface Enum<G extends GrammarMap, K extends Under<'declaration.type.enum'> = 'declaration.type.enum'> {
			readonly whereClause?: Slot<G, K, 'whereClause', V.Clause.Where<G>>;
			// r only
		}
	}
	export interface Extension<G extends GrammarMap, K extends Under<'declaration.extension'> = 'declaration.extension'> {
		readonly whereClause?: Slot<G, K, 'whereClause', V.Clause.Where<G>>;
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarMap, K extends Under<'declaration.extension.conformance'> = 'declaration.extension.conformance'> {
			readonly whereClause?: Slot<G, K, 'whereClause', V.Clause.Where<G>>;
		}
	}
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
		readonly whereClause?: Slot<G, K, 'whereClause', V.Clause.Where<G>>;
		// r only
	}
	export namespace Function {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.function.signature'> = 'declaration.function.signature'> {
			readonly whereClause?: Slot<G, K, 'whereClause', V.Clause.Where<G>>;
			// r only
		}
	}
	export namespace Type {
		export namespace Interface {
			export interface Trait<G extends GrammarMap, K extends Under<'declaration.type.interface.trait'> = 'declaration.type.interface.trait'> {
				readonly whereClause?: Slot<G, K, 'whereClause', V.Clause.Where<G>>;
			}
		}
	}
	export namespace Member {
		export interface Method<G extends GrammarMap, K extends Under<'declaration.member.method'> = 'declaration.member.method'> {
			readonly whereClause?: Slot<G, K, 'whereClause', V.Clause.Where<G>>;
			// rt only
		}
		export namespace Method {
			export interface Signature<G extends GrammarMap, K extends Under<'declaration.member.method.signature'> = 'declaration.member.method.signature'> {
				readonly whereClause?: Slot<G, K, 'whereClause', V.Clause.Where<G>>;
				// r only
			}
		}
	}
	export namespace Type {
		export interface TypeAlias<G extends GrammarMap, K extends Under<'declaration.type.type_alias'> = 'declaration.type.type_alias'> {
			readonly trailingWhereClause?: Slot<G, K, 'trailingWhereClause', V.Clause.Where<G>>;
			// r only
			readonly whereClause?: Slot<G, K, 'whereClause', V.Clause.Where<G>>;
			// r only
		}
		export namespace TypeAlias {
			export interface Associated<G extends GrammarMap, K extends Under<'declaration.type.type_alias.associated'> = 'declaration.type.type_alias.associated'> {
				readonly whereClause?: Slot<G, K, 'whereClause', V.Clause.Where<G>>;
			}
		}
		export interface Union<G extends GrammarMap, K extends Under<'declaration.type.union'> = 'declaration.type.union'> {
			readonly whereClause?: Slot<G, K, 'whereClause', V.Clause.Where<G>>;
		}
	}
}
