import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Export<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by t
		readonly $kind: 'statement.export';
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
		export interface All<G extends GrammarMap> extends SubKindOf<V.Statement.Export<G>> {
			// claimed by t
			readonly $kind: 'statement.export.all';
		}
		export interface Default<G extends GrammarMap> extends SubKindOf<V.Statement.Export<G>> {
			// claimed by t
			readonly $kind: 'statement.export.default';
		}
	}
	export interface Import<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.import';
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
		export interface Alias<G extends GrammarMap> extends SubKindOf<V.Statement.Import<G>> {
			// claimed by t
			readonly $kind: 'statement.import.alias';
			readonly name: Slot<G, 'statement.import.alias', 'name', V.Identifier.Any<G>>;
			readonly value: Slot<G, 'statement.import.alias', 'value', V.Identifier.Any<G>>;
		}
		export interface From<G extends GrammarMap> extends SubKindOf<V.Statement.Import<G>> {
			// claimed by p
			readonly $kind: 'statement.import.from';
			readonly content:
				Slot<G, 'statement.import.from', 'content', V.Identifier.Qualified<G> | V.Clause.Import.Any<G>> | Slot<G, 'statement.import.from', 'content', V.Identifier.Qualified<G> | V.Clause.Import.Any<G>>[];
			readonly moduleName: V.Clause.Import.Relative<G> | V.Identifier.Qualified<G>;
		}
		export interface Future<G extends GrammarMap> extends SubKindOf<V.Statement.Import<G>> {
			// claimed by p
			readonly $kind: 'statement.import.future';
			readonly content: (V.Clause.Import.Alias<G> | V.Identifier.Qualified<G>)[];
		}
		export interface Package<G extends GrammarMap> extends SubKindOf<V.Statement.Import<G>> {
			// claimed by r
			readonly $kind: 'statement.import.package';
			readonly alias?: Slot<G, 'statement.import.package', 'alias', V.Identifier.Any<G>>;
			readonly name: Slot<G, 'statement.import.package', 'name', V.Identifier.Any<G>>;
		}
		export interface Typeof<G extends GrammarMap> extends SubKindOf<V.Statement.Import<G>> {
			// claimed by t
			readonly $kind: 'statement.import.typeof';
		}
	}
}
