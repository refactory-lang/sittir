import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Export<G extends GrammarMap, K extends Under<'statement.export'> = 'statement.export'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly declaration?: Slot<G, K, 'declaration', V.Declaration.Any<G> | V.Statement.Any<G>>;
		readonly decorators?: Slot<G, K, 'decorators', V.Attribute.Decorator<G>>[];
		readonly exportClause?: Slot<G, K, 'exportClause', V.Clause.Export<G> | V.Clause.Export.Namespace<G>>;
		readonly name?: Slot<G, K, 'name', V.Identifier.Any<G>>;
		readonly source?: Slot<G, K, 'source', V.Literal.String<G>>;
		readonly value?: Slot<
			G,
			K,
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
			readonly $path: K;
		}
		export interface Default<G extends GrammarMap, K extends Under<'statement.export.default'> = 'statement.export.default'> extends SubKindOf<V.Statement.Export<G, K>> {
			// claimed by t
			readonly $path: K;
		}
	}
	export interface Import<G extends GrammarMap, K extends Under<'statement.import'> = 'statement.import'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly argument?: Slot<
			G,
			K,
			'argument',
			| V.Identifier.Any<G>
			| V.Clause.Import.Alias<G>
			| V.Clause.Import.List.Any<G>
			| V.Clause.Import.Wildcard<G>
			| string
		>;
		// r only
		readonly fromClause?: Slot<G, K, 'fromClause', V.Clause.Import.Require<G> | V.Literal.String<G>>;
		// t only
		readonly importAttribute?: Slot<G, K, 'importAttribute', V.Clause.Import.Attribute<G>>;
		// t only
		readonly importClause?: Slot<G, K, 'importClause', V.Clause.Import.Names<G>>;
		// t only
		readonly names?: Slot<G, K, 'names', V.Clause.Import.Alias<G> | V.Identifier.Qualified<G>>[];
		// p only
		readonly source?: Slot<G, K, 'source', V.Literal.String<G>>;
		// t only
	}
	export namespace Import {
		export interface Alias<G extends GrammarMap, K extends Under<'statement.import.alias'> = 'statement.import.alias'> extends SubKindOf<V.Statement.Import<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
			readonly value: Slot<G, K, 'value', V.Identifier.Any<G>>;
		}
		export interface From<G extends GrammarMap, K extends Under<'statement.import.from'> = 'statement.import.from'> extends SubKindOf<V.Statement.Import<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly content:
				Slot<G, K, 'content', V.Identifier.Qualified<G> | V.Clause.Import.Any<G>> | Slot<G, K, 'content', V.Identifier.Qualified<G> | V.Clause.Import.Any<G>>[];
			readonly moduleName: Slot<G, K, 'moduleName', V.Clause.Import.Relative<G> | V.Identifier.Qualified<G>>;
		}
		export interface Future<G extends GrammarMap, K extends Under<'statement.import.future'> = 'statement.import.future'> extends SubKindOf<V.Statement.Import<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly content: Slot<G, K, 'content', V.Clause.Import.Alias<G> | V.Identifier.Qualified<G>>[];
		}
		export interface Package<G extends GrammarMap, K extends Under<'statement.import.package'> = 'statement.import.package'> extends SubKindOf<V.Statement.Import<G, K>> {
			// claimed by r
			readonly $path: K;
			readonly alias?: Slot<G, K, 'alias', V.Identifier.Any<G>>;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		}
		export interface Typeof<G extends GrammarMap, K extends Under<'statement.import.typeof'> = 'statement.import.typeof'> extends SubKindOf<V.Statement.Import<G, K>> {
			// claimed by t
			readonly $path: K;
		}
	}
}
