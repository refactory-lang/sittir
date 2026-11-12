import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
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
	export namespace Import {
		export interface Alias<G extends GrammarMap, K extends Under<'statement.import.alias'> = 'statement.import.alias'> extends SubKindOf<V.Statement.Import<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
			readonly value: Slot<G, K, 'value', V.Identifier.Any<G>>;
		}
		export interface Typeof<G extends GrammarMap, K extends Under<'statement.import.typeof'> = 'statement.import.typeof'> extends SubKindOf<V.Statement.Import<G, K>> {
			// claimed by t
			readonly $path: K;
		}
	}
}
