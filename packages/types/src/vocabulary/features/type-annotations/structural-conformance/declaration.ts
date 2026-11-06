import type { GrammarMap, Slot } from '../../../map.ts';
import type { Flag, SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Signature<G extends GrammarMap> extends SubKindOf<V.Declaration<G>> {
		readonly $kind: 'declaration.signature';
	}
	export namespace Signature {
		export interface Call<G extends GrammarMap> extends SubKindOf<V.Declaration.Signature<G>> {
			// claimed by t
			readonly $kind: 'declaration.signature.call';
			readonly parameters: (
				| V.Declaration.Parameter<G>
				| V.Declaration.Parameter.Private<G>
				| V.Declaration.Parameter.Protected<G>
				| V.Declaration.Parameter.Public<G>
				| V.Declaration.Parameter.Receiver<G>
			)[];
			readonly returnType?: Slot<G, 'declaration.signature.call', 'returnType', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
		export interface Construct<G extends GrammarMap> extends SubKindOf<V.Declaration.Signature<G>> {
			// claimed by t
			readonly $kind: 'declaration.signature.construct';
			readonly parameters: (
				| V.Declaration.Parameter<G>
				| V.Declaration.Parameter.Private<G>
				| V.Declaration.Parameter.Protected<G>
				| V.Declaration.Parameter.Public<G>
				| V.Declaration.Parameter.Receiver<G>
			)[];
			readonly type?: Slot<G, 'declaration.signature.construct', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
		export interface Index<G extends GrammarMap> extends SubKindOf<V.Declaration.Signature<G>> {
			// claimed by t
			readonly $kind: 'declaration.signature.index';
			readonly indexType?: Slot<G, 'declaration.signature.index', 'indexType', V.Identifier.Any<G> | V.Type.Any<G>>;
			readonly name?: Slot<G, 'declaration.signature.index', 'name', V.Identifier.Any<G> | string>;
			readonly readonly?: Flag;
			readonly sign?: Slot<G, 'declaration.signature.index', 'sign', string>;
			readonly type: Slot<G, 'declaration.signature.index', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
		export namespace Index {
			export interface Mapped<G extends GrammarMap> extends SubKindOf<V.Declaration.Signature.Index<G>> {
				// claimed by t
				readonly $kind: 'declaration.signature.index.mapped';
				readonly mappedTypeClause: V.Clause.MappedType<G>;
			}
		}
	}
}
