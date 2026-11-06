import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Export<G extends GrammarMap, K extends Under<'clause.export'> = 'clause.export'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly exportSpecifiers?: Slot<G, K, 'exportSpecifiers', V.Clause.Export.Specifier.Any<G>>[];
	}
	export namespace Export {
		export interface Namespace<G extends GrammarMap, K extends Under<'clause.export.namespace'> = 'clause.export.namespace'> extends SubKindOf<V.Clause.Export<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly moduleExportName: Slot<G, K, 'moduleExportName', V.Identifier.Any<G> | V.Literal.String<G>>;
		}
		export interface Specifier<G extends GrammarMap, K extends Under<'clause.export.specifier'> = 'clause.export.specifier'> extends SubKindOf<V.Clause.Export<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly alias?: Slot<G, K, 'alias', V.Identifier.Any<G> | V.Literal.String<G>>;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G> | V.Literal.String<G>>;
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
			readonly alias: Slot<G, K, 'alias', V.Identifier.Any<G>>;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G> | string>;
		}
		export interface Attribute<G extends GrammarMap, K extends Under<'clause.import.attribute'> = 'clause.import.attribute'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly attributeKind: Slot<G, K, 'attributeKind', string>;
			readonly object: Slot<G, K, 'object', V.Expression.Collection.Object<G>>;
		}
		export interface List<G extends GrammarMap, K extends Under<'clause.import.list'> = 'clause.import.list'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly useClauses?: Slot<
				G,
				K,
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
				readonly list: Slot<G, K, 'list', V.Clause.Import.List<G>>;
				readonly path?: Slot<G, K, 'path', V.Identifier.Any<G>>;
			}
		}
		export interface Names<G extends GrammarMap, K extends Under<'clause.import.names'> = 'clause.import.names'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly content?: Slot<
				G,
				K,
				'content',
				| V.Clause.Import.Namespace<G>
				| V.Clause.Import.Specifier.Any<G>
			>[];
			readonly default?: Slot<G, K, 'default', V.Identifier.Any<G>>;
		}
		export interface Namespace<G extends GrammarMap, K extends Under<'clause.import.namespace'> = 'clause.import.namespace'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		}
		export interface Relative<G extends GrammarMap, K extends Under<'clause.import.relative'> = 'clause.import.relative'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by p
			readonly $kind: K;
			readonly dots?: Slot<G, K, 'dots', V.Clause.Import.Relative.Prefix<G>>;
			readonly name?: Slot<G, K, 'name', V.Identifier.Qualified<G>>;
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
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
			readonly source: Slot<G, K, 'source', V.Literal.String<G>>;
		}
		export interface Specifier<G extends GrammarMap, K extends Under<'clause.import.specifier'> = 'clause.import.specifier'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly alias?: Slot<G, K, 'alias', V.Identifier.Any<G> | string>;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G> | V.Literal.String<G> | string>;
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
			readonly useWildcardGroup?: Slot<G, K, 'useWildcardGroup', unknown>;
			// r only
		}
	}
}
