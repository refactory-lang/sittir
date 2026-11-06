import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Export<G extends GrammarMap> extends SubKindOf<V.Clause<G>> {
		// claimed by t
		readonly $kind: 'clause.export';
		readonly exportSpecifiers?: V.Clause.Export.Specifier.Any<G>[];
	}
	export namespace Export {
		export interface Namespace<G extends GrammarMap> extends SubKindOf<V.Clause.Export<G>> {
			// claimed by t
			readonly $kind: 'clause.export.namespace';
			readonly moduleExportName: Slot<G, 'clause.export.namespace', 'moduleExportName', V.Identifier.Any<G> | V.Literal.String<G>>;
		}
		export interface Specifier<G extends GrammarMap> extends SubKindOf<V.Clause.Export<G>> {
			// claimed by t
			readonly $kind: 'clause.export.specifier';
			readonly alias?: Slot<G, 'clause.export.specifier', 'alias', V.Identifier.Any<G> | V.Literal.String<G>>;
			readonly name: Slot<G, 'clause.export.specifier', 'name', V.Identifier.Any<G> | V.Literal.String<G>>;
		}
		export namespace Specifier {
			export interface Typeof<G extends GrammarMap> extends SubKindOf<V.Clause.Export.Specifier<G>> {
				// claimed by t
				readonly $kind: 'clause.export.specifier.typeof';
			}
		}
	}
	export interface Import<G extends GrammarMap> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.import';
	}
	export namespace Import {
		export interface Alias<G extends GrammarMap> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by pr
			readonly $kind: 'clause.import.alias';
			readonly alias: Slot<G, 'clause.import.alias', 'alias', V.Identifier.Any<G>>;
			readonly name: Slot<G, 'clause.import.alias', 'name', V.Identifier.Any<G> | string>;
		}
		export interface Attribute<G extends GrammarMap> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by t
			readonly $kind: 'clause.import.attribute';
			readonly attributeKind: Slot<G, 'clause.import.attribute', 'attributeKind', string>;
			readonly object: V.Expression.Collection.Object<G>;
		}
		export interface List<G extends GrammarMap> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by r
			readonly $kind: 'clause.import.list';
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
			export interface Scoped<G extends GrammarMap> extends SubKindOf<V.Clause.Import.List<G>> {
				// claimed by r
				readonly $kind: 'clause.import.list.scoped';
				readonly list: V.Clause.Import.List<G>;
				readonly path?: Slot<G, 'clause.import.list.scoped', 'path', V.Identifier.Any<G>>;
			}
		}
		export interface Names<G extends GrammarMap> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by t
			readonly $kind: 'clause.import.names';
			readonly content?: Slot<
				G,
				'clause.import.names',
				'content',
				| V.Clause.Import.Namespace<G>
				| V.Clause.Import.Specifier.Any<G>
			>[];
			readonly default?: Slot<G, 'clause.import.names', 'default', V.Identifier.Any<G>>;
		}
		export interface Namespace<G extends GrammarMap> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by t
			readonly $kind: 'clause.import.namespace';
			readonly name: Slot<G, 'clause.import.namespace', 'name', V.Identifier.Any<G>>;
		}
		export interface Relative<G extends GrammarMap> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by p
			readonly $kind: 'clause.import.relative';
			readonly dots?: V.Clause.Import.Relative.Prefix<G>;
			readonly name?: V.Identifier.Qualified<G>;
		}
		export namespace Relative {
			export interface Prefix<G extends GrammarMap> extends SubKindOf<V.Clause.Import.Relative<G>> {
				// claimed by p
				readonly $kind: 'clause.import.relative.prefix';
			}
		}
		export interface Require<G extends GrammarMap> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by t
			readonly $kind: 'clause.import.require';
			readonly name: Slot<G, 'clause.import.require', 'name', V.Identifier.Any<G>>;
			readonly source: V.Literal.String<G>;
		}
		export interface Specifier<G extends GrammarMap> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by t
			readonly $kind: 'clause.import.specifier';
			readonly alias?: Slot<G, 'clause.import.specifier', 'alias', V.Identifier.Any<G> | string>;
			readonly name: Slot<G, 'clause.import.specifier', 'name', V.Identifier.Any<G> | V.Literal.String<G> | string>;
		}
		export namespace Specifier {
			export interface Typeof<G extends GrammarMap> extends SubKindOf<V.Clause.Import.Specifier<G>> {
				// claimed by t
				readonly $kind: 'clause.import.specifier.typeof';
			}
		}
		export interface Wildcard<G extends GrammarMap> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by pr
			readonly $kind: 'clause.import.wildcard';
			readonly useWildcardGroup?: Slot<G, 'clause.import.wildcard', 'useWildcardGroup', unknown>;
			// r only
		}
	}
}
