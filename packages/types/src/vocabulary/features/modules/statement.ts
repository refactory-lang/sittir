import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Export<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		readonly $kind: 'statement.export';
	}
	export interface Import<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		readonly $kind: 'statement.import';
		readonly argument?: G['slots']['statement.import']['argument'];
		readonly fromClause?: G['slots']['statement.import']['fromClause'];
		readonly importAttribute?: V.Clause.Import.Attribute<G>;
		readonly importClause?: G['slots']['statement.import']['importClause'];
		readonly names?: (V.Clause.Import.Alias<G> | V.Identifier.Dotted<G>)[];
	}
	export namespace Import {
		export interface Crate<G extends GrammarContext<G>> extends SubKindOf<V.Statement.Import<G>> {
			readonly $kind: 'statement.import.crate';
			readonly alias?: G['identifier'];
			readonly name: G['identifier'];
		}
		export interface From<G extends GrammarContext<G>> extends SubKindOf<V.Statement.Import<G>> {
			readonly $kind: 'statement.import.from';
			readonly content: V.Identifier.Dotted<G> | V.Clause.Import.Any<G> | (V.Identifier.Dotted<G> | V.Clause.Import.Any<G>)[];
			readonly moduleName: V.Clause.Import.Relative<G> | V.Identifier.Dotted<G>;
		}
		export interface Future<G extends GrammarContext<G>> extends SubKindOf<V.Statement.Import<G>> {
			readonly $kind: 'statement.import.future';
			readonly content: (V.Clause.Import.Alias<G> | V.Identifier.Dotted<G>)[];
		}
	}
}
