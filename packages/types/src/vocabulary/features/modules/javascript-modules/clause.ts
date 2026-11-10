import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Clause {
	export interface Export<G extends GrammarMap, K extends Under<'clause.export'> = 'clause.export'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly exportSpecifiers?: Slot<G, K, 'exportSpecifiers', V.Clause.Export.Specifier.Any<G>>[];
	}
	export namespace Export {
		export interface Namespace<G extends GrammarMap, K extends Under<'clause.export.namespace'> = 'clause.export.namespace'> extends SubKindOf<V.Clause.Export<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly moduleExportName: Slot<G, K, 'moduleExportName', V.Identifier.Any<G> | V.Literal.String<G>>;
		}
		export interface Specifier<G extends GrammarMap, K extends Under<'clause.export.specifier'> = 'clause.export.specifier'> extends SubKindOf<V.Clause.Export<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly alias?: Slot<G, K, 'alias', V.Identifier.Any<G> | V.Literal.String<G>>;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G> | V.Literal.String<G>>;
		}
		export namespace Specifier {
			export interface Typeof<G extends GrammarMap, K extends Under<'clause.export.specifier.typeof'> = 'clause.export.specifier.typeof'> extends SubKindOf<V.Clause.Export.Specifier<G, K>> {
				// claimed by t
				readonly $path: K;
			}
		}
	}
	export namespace Import {
		export interface Attribute<G extends GrammarMap, K extends Under<'clause.import.attribute'> = 'clause.import.attribute'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly attributeKind: Slot<G, K, 'attributeKind', string>;
			readonly object: Slot<G, K, 'object', V.Expression.Collection.Object<G>>;
		}
		export interface Names<G extends GrammarMap, K extends Under<'clause.import.names'> = 'clause.import.names'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by t
			readonly $path: K;
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
			readonly $path: K;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		}
		export interface Require<G extends GrammarMap, K extends Under<'clause.import.require'> = 'clause.import.require'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
			readonly source: Slot<G, K, 'source', V.Literal.String<G>>;
		}
		export interface Specifier<G extends GrammarMap, K extends Under<'clause.import.specifier'> = 'clause.import.specifier'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly alias?: Slot<G, K, 'alias', V.Identifier.Any<G> | string>;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G> | V.Literal.String<G> | string>;
		}
		export namespace Specifier {
			export interface Typeof<G extends GrammarMap, K extends Under<'clause.import.specifier.typeof'> = 'clause.import.specifier.typeof'> extends SubKindOf<V.Clause.Import.Specifier<G, K>> {
				// claimed by t
				readonly $path: K;
			}
		}
	}
}
