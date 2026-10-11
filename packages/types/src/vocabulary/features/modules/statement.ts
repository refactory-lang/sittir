import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Export<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by t
		readonly $kind: 'statement.export';
		readonly declaration?: G['slots']['statement.export']['declaration'];
		readonly decorators?: V.Attribute.Decorator<G>[];
		readonly exportClause?: V.Clause.Export<G> | V.Clause.Export.Namespace<G>;
		readonly name?: G['identifier'];
		readonly source?: V.Literal.String<G>;
		readonly value?: G['slots']['statement.export']['value'];
	}
	export namespace Export {
		export interface All<G extends GrammarContext<G>> extends SubKindOf<V.Statement.Export<G>> {
			// claimed by t
			readonly $kind: 'statement.export.all';
		}
		export interface Default<G extends GrammarContext<G>> extends SubKindOf<V.Statement.Export<G>> {
			// claimed by t
			readonly $kind: 'statement.export.default';
		}
	}
	export interface Import<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by prt
		readonly $kind: 'statement.import';
		readonly argument?: G['slots']['statement.import']['argument'];
		// r only
		readonly fromClause?: G['slots']['statement.import']['fromClause'];
		// t only
		readonly importAttribute?: V.Clause.Import.Attribute<G>;
		// t only
		readonly importClause?: V.Clause.Import.Names<G>;
		// t only
		readonly names?: (V.Clause.Import.Alias<G> | V.Identifier.Dotted<G>)[];
		// p only
		readonly source?: V.Literal.String<G>;
		// t only
	}
	export namespace Import {
		export interface Crate<G extends GrammarContext<G>> extends SubKindOf<V.Statement.Import<G>> {
			// claimed by r
			readonly $kind: 'statement.import.crate';
			readonly alias?: G['identifier'];
			readonly name: G['identifier'];
		}
		export interface From<G extends GrammarContext<G>> extends SubKindOf<V.Statement.Import<G>> {
			// claimed by p
			readonly $kind: 'statement.import.from';
			readonly content:
				| V.Identifier.Dotted<G>
				| V.Clause.Import.Any<G>
				| (V.Identifier.Dotted<G> | V.Clause.Import.Any<G>)[];
			readonly moduleName: V.Clause.Import.Relative<G> | V.Identifier.Dotted<G>;
		}
		export interface Future<G extends GrammarContext<G>> extends SubKindOf<V.Statement.Import<G>> {
			// claimed by p
			readonly $kind: 'statement.import.future';
			readonly content: (V.Clause.Import.Alias<G> | V.Identifier.Dotted<G>)[];
		}
		export interface Type<G extends GrammarContext<G>> extends SubKindOf<V.Statement.Import<G>> {
			// claimed by t
			readonly $kind: 'statement.import.type';
		}
		export interface Typeof<G extends GrammarContext<G>> extends SubKindOf<V.Statement.Import<G>> {
			// claimed by t
			readonly $kind: 'statement.import.typeof';
		}
	}
}
