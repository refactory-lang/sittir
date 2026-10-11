import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Export<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by t
		readonly $kind: 'clause.export';
		readonly exportSpecifiers?: V.Clause.Export.Specifier<G>[];
	}
	export namespace Export {
		export interface Namespace<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Export<G>> {
			// claimed by t
			readonly $kind: 'clause.export.namespace';
			readonly moduleExportName: G['slots']['clause.export.namespace']['moduleExportName'];
		}
		export interface Specifier<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Export<G>> {
			// claimed by t
			readonly $kind: 'clause.export.specifier';
			readonly alias?: G['slots']['clause.export.specifier']['alias'];
			readonly exportKind?: G['slots']['clause.export.specifier']['exportKind'];
			readonly name: G['slots']['clause.export.specifier']['name'];
		}
	}
	export interface Import<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.import';
	}
	export namespace Import {
		export interface Alias<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by pt
			readonly $kind: 'clause.import.alias';
			readonly alias?: G['identifier'];
			// p only
			readonly name: G['identifier'];
			readonly value?: G['identifier'];
			// t only
		}
		export interface As<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by r
			readonly $kind: 'clause.import.as';
			readonly alias: G['identifier'];
			readonly path: G['identifier'];
		}
		export interface Attribute<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by t
			readonly $kind: 'clause.import.attribute';
			readonly attributeKind: G['slots']['clause.import.attribute']['attributeKind'];
			readonly object: V.Expression.Collection.Object<G>;
		}
		export interface List<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by r
			readonly $kind: 'clause.import.list';
			readonly useClauses?: G['slots']['clause.import.list']['useClauses'][];
		}
		export namespace List {
			export interface Scoped<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import.List<G>> {
				// claimed by r
				readonly $kind: 'clause.import.list.scoped';
				readonly list: V.Clause.Import.List<G>;
				readonly path?: G['identifier'];
			}
		}
		export interface Names<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by t
			readonly $kind: 'clause.import.names';
			readonly content?: G['slots']['clause.import.names']['content'] | G['slots']['clause.import.names']['content'][];
			readonly default?: G['identifier'];
		}
		export interface Namespace<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by t
			readonly $kind: 'clause.import.namespace';
			readonly name: G['identifier'];
		}
		export interface Relative<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by p
			readonly $kind: 'clause.import.relative';
			readonly name?: V.Identifier.Dotted<G>;
			readonly prefix?: V.Clause.Import.Relative.Prefix<G>;
		}
		export namespace Relative {
			export interface Prefix<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import.Relative<G>> {
				// claimed by p
				readonly $kind: 'clause.import.relative.prefix';
			}
		}
		export interface Require<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by t
			readonly $kind: 'clause.import.require';
			readonly name: G['identifier'];
			readonly source: V.Literal.String<G>;
		}
		export interface Specifier<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by t
			readonly $kind: 'clause.import.specifier';
			readonly alias?: G['slots']['clause.import.specifier']['alias'];
			readonly importKind?: G['slots']['clause.import.specifier']['importKind'];
			readonly name: G['slots']['clause.import.specifier']['name'];
		}
		export interface Wildcard<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by pr
			readonly $kind: 'clause.import.wildcard';
			readonly useWildcardGroup?: G['slots']['clause.import.wildcard']['useWildcardGroup'];
			// r only
		}
	}
}
