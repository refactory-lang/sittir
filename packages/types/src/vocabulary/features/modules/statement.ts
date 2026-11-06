import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Export<G extends GrammarMap, K extends Under<'statement.export'> = 'statement.export'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly declaration?: Slot<G, 'statement.export', 'declaration', V.Declaration.Any<G> | V.Statement.Any<G>>;
		readonly decorators?: V.Attribute.Decorator<G>[];
		readonly exportClause?: V.Clause.Export<G> | V.Clause.Export.Namespace<G>;
		readonly name?: Slot<G, 'statement.export', 'name', V.Identifier.Any<G>>;
		readonly source?: V.Literal.String<G>;
		readonly value?: Slot<
			G,
			'statement.export',
			'value',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Modifier.Any<G>
			| V.Type.Primitive<G>
		>;
	}
	export namespace Export {
		export interface All<G extends GrammarMap, K extends Under<'statement.export.all'> = 'statement.export.all'> extends SubKindOf<V.Statement.Export<G, K>> {
			// claimed by t
			readonly $kind: K;
		}
		export interface Default<G extends GrammarMap, K extends Under<'statement.export.default'> = 'statement.export.default'> extends SubKindOf<V.Statement.Export<G, K>> {
			// claimed by t
			readonly $kind: K;
		}
	}
	export interface Import<G extends GrammarMap, K extends Under<'statement.import'> = 'statement.import'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly argument?: Slot<
			G,
			'statement.import',
			'argument',
			| V.Identifier.Any<G>
			| V.Clause.Import.Alias<G>
			| V.Clause.Import.List.Any<G>
			| V.Clause.Import.Wildcard<G>
			| string
		>;
		// r only
		readonly fromClause?: Slot<G, 'statement.import', 'fromClause', V.Clause.Import.Require<G> | V.Literal.String<G>>;
		// t only
		readonly importAttribute?: V.Clause.Import.Attribute<G>;
		// t only
		readonly importClause?: V.Clause.Import.Names<G>;
		// t only
		readonly names?: (V.Clause.Import.Alias<G> | V.Identifier.Qualified<G>)[];
		// p only
		readonly source?: V.Literal.String<G>;
		// t only
	}
	export namespace Import {
		export interface Alias<G extends GrammarMap, K extends Under<'statement.import.alias'> = 'statement.import.alias'> extends SubKindOf<V.Statement.Import<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly name: Slot<G, 'statement.import.alias', 'name', V.Identifier.Any<G>>;
			readonly value: Slot<G, 'statement.import.alias', 'value', V.Identifier.Any<G>>;
		}
		export interface From<G extends GrammarMap, K extends Under<'statement.import.from'> = 'statement.import.from'> extends SubKindOf<V.Statement.Import<G, K>> {
			// claimed by p
			readonly $kind: K;
			readonly content:
				Slot<G, 'statement.import.from', 'content', V.Identifier.Qualified<G> | V.Clause.Import.Any<G>> | Slot<G, 'statement.import.from', 'content', V.Identifier.Qualified<G> | V.Clause.Import.Any<G>>[];
			readonly moduleName: V.Clause.Import.Relative<G> | V.Identifier.Qualified<G>;
		}
		export interface Future<G extends GrammarMap, K extends Under<'statement.import.future'> = 'statement.import.future'> extends SubKindOf<V.Statement.Import<G, K>> {
			// claimed by p
			readonly $kind: K;
			readonly content: (V.Clause.Import.Alias<G> | V.Identifier.Qualified<G>)[];
		}
		export interface Package<G extends GrammarMap, K extends Under<'statement.import.package'> = 'statement.import.package'> extends SubKindOf<V.Statement.Import<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly alias?: Slot<G, 'statement.import.package', 'alias', V.Identifier.Any<G>>;
			readonly name: Slot<G, 'statement.import.package', 'name', V.Identifier.Any<G>>;
		}
		export interface Typeof<G extends GrammarMap, K extends Under<'statement.import.typeof'> = 'statement.import.typeof'> extends SubKindOf<V.Statement.Import<G, K>> {
			// claimed by t
			readonly $kind: K;
		}
	}
}
