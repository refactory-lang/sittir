import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Struct<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by r
		readonly $kind: 'declaration.struct';
		readonly body?: G['slots']['declaration.struct']['body'][];
		readonly name: V.Identifier.Type<G>;
		readonly typeParameters?: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		readonly whereClause?: V.Clause.Where<G>;
	}
	export namespace Struct {
		export interface Tuple<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Struct<G>> {
			// claimed by r
			readonly $kind: 'declaration.struct.tuple';
			readonly body: G['slots']['declaration.struct.tuple']['body'][];
		}
		export interface Unit<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Struct<G>> {
			// claimed by r
			readonly $kind: 'declaration.struct.unit';
		}
	}
}
