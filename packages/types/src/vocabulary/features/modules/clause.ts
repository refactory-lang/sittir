import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Export<G extends GrammarMap, K extends Under<'clause.export'> = 'clause.export'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly exportSpecifiers?: V.Clause.Export.Specifier.Any<G>[];
	}
	export namespace Export {
		export interface Namespace<G extends GrammarMap, K extends Under<'clause.export.namespace'> = 'clause.export.namespace'> extends SubKindOf<V.Clause.Export<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly moduleExportName: Slot<G, 'clause.export.namespace', 'moduleExportName', V.Identifier.Any<G> | V.Literal.String<G>>;
		}
		export interface Specifier<G extends GrammarMap, K extends Under<'clause.export.specifier'> = 'clause.export.specifier'> extends SubKindOf<V.Clause.Export<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly alias?: Slot<G, 'clause.export.specifier', 'alias', V.Identifier.Any<G> | V.Literal.String<G>>;
			readonly name: Slot<G, 'clause.export.specifier', 'name', V.Identifier.Any<G> | V.Literal.String<G>>;
		}
		export namespace Specifier {
			export interface Typeof<G extends GrammarMap, K extends Under<'clause.export.specifier.typeof'> = 'clause.export.specifier.typeof'> extends SubKindOf<V.Clause.Export.Specifier<G, K>> {
				// claimed by t
				readonly $kind: K;
			}
		}
	}
	export interface Import<G extends GrammarMap, K extends Under<'clause.import'> = 'clause.import'> extends SubKindOf<V.Clause<G, K>> {
		readonly $kind: K;
	}
	export namespace Import {
		export interface Alias<G extends GrammarMap, K extends Under<'clause.import.alias'> = 'clause.import.alias'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by pr
			readonly $kind: K;
			readonly alias: Slot<G, 'clause.import.alias', 'alias', V.Identifier.Any<G>>;
			readonly name: Slot<G, 'clause.import.alias', 'name', V.Identifier.Any<G> | string>;
		}
		export interface Attribute<G extends GrammarMap, K extends Under<'clause.import.attribute'> = 'clause.import.attribute'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly attributeKind: Slot<G, 'clause.import.attribute', 'attributeKind', string>;
			readonly object: V.Expression.Collection.Object<G>;
		}
		export interface List<G extends GrammarMap, K extends Under<'clause.import.list'> = 'clause.import.list'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly useClauses?: Slot<
				G,
				'clause.import.list',
				'useClauses',
				| V.Identifier.Any<G>
				| V.Clause.Import.Alias<G>
				| V.Clause.Import.List.Any<G>
				| V.Clause.Import.Wildcard<G>
			>[];
		}
		export namespace List {
			export interface Scoped<G extends GrammarMap, K extends Under<'clause.import.list.scoped'> = 'clause.import.list.scoped'> extends SubKindOf<V.Clause.Import.List<G, K>> {
				// claimed by r
				readonly $kind: K;
				readonly list: V.Clause.Import.List<G>;
				readonly path?: Slot<G, 'clause.import.list.scoped', 'path', V.Identifier.Any<G>>;
			}
		}
		export interface Names<G extends GrammarMap, K extends Under<'clause.import.names'> = 'clause.import.names'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly content?: Slot<
				G,
				'clause.import.names',
				'content',
				| V.Clause.Import.Namespace<G>
				| V.Clause.Import.Specifier.Any<G>
			>[];
			readonly default?: Slot<G, 'clause.import.names', 'default', V.Identifier.Any<G>>;
		}
		export interface Namespace<G extends GrammarMap, K extends Under<'clause.import.namespace'> = 'clause.import.namespace'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly name: Slot<G, 'clause.import.namespace', 'name', V.Identifier.Any<G>>;
		}
		export interface Relative<G extends GrammarMap, K extends Under<'clause.import.relative'> = 'clause.import.relative'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by p
			readonly $kind: K;
			readonly dots?: V.Clause.Import.Relative.Prefix<G>;
			readonly name?: V.Identifier.Qualified<G>;
		}
		export namespace Relative {
			export interface Prefix<G extends GrammarMap, K extends Under<'clause.import.relative.prefix'> = 'clause.import.relative.prefix'> extends SubKindOf<V.Clause.Import.Relative<G, K>> {
				// claimed by p
				readonly $kind: K;
			}
		}
		export interface Require<G extends GrammarMap, K extends Under<'clause.import.require'> = 'clause.import.require'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly name: Slot<G, 'clause.import.require', 'name', V.Identifier.Any<G>>;
			readonly source: V.Literal.String<G>;
		}
		export interface Specifier<G extends GrammarMap, K extends Under<'clause.import.specifier'> = 'clause.import.specifier'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly alias?: Slot<G, 'clause.import.specifier', 'alias', V.Identifier.Any<G> | string>;
			readonly name: Slot<G, 'clause.import.specifier', 'name', V.Identifier.Any<G> | V.Literal.String<G> | string>;
		}
		export namespace Specifier {
			export interface Typeof<G extends GrammarMap, K extends Under<'clause.import.specifier.typeof'> = 'clause.import.specifier.typeof'> extends SubKindOf<V.Clause.Import.Specifier<G, K>> {
				// claimed by t
				readonly $kind: K;
			}
		}
		export interface Wildcard<G extends GrammarMap, K extends Under<'clause.import.wildcard'> = 'clause.import.wildcard'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by pr
			readonly $kind: K;
			readonly useWildcardGroup?: Slot<G, 'clause.import.wildcard', 'useWildcardGroup', unknown>;
			// r only
		}
	}
}
