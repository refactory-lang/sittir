import type { GrammarMap, Slot } from '../../../map.ts';
import type { Flag, SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Signature<G extends GrammarMap, K extends Under<'declaration.signature'> = 'declaration.signature'> extends SubKindOf<V.Declaration<G, K>> {
		readonly $kind: K;
	}
	export namespace Signature {
		export interface Call<G extends GrammarMap, K extends Under<'declaration.signature.call'> = 'declaration.signature.call'> extends SubKindOf<V.Declaration.Signature<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly parameters: Slot<
				G,
				K,
				'parameters',
				| V.Declaration.Parameter<G>
				| V.Declaration.Parameter.Private<G>
				| V.Declaration.Parameter.Protected<G>
				| V.Declaration.Parameter.Public<G>
				| V.Declaration.Parameter.Receiver<G>
			>[];
			readonly returnType?: Slot<G, K, 'returnType', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
		export interface Construct<G extends GrammarMap, K extends Under<'declaration.signature.construct'> = 'declaration.signature.construct'> extends SubKindOf<V.Declaration.Signature<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly parameters: Slot<
				G,
				K,
				'parameters',
				| V.Declaration.Parameter<G>
				| V.Declaration.Parameter.Private<G>
				| V.Declaration.Parameter.Protected<G>
				| V.Declaration.Parameter.Public<G>
				| V.Declaration.Parameter.Receiver<G>
			>[];
			readonly type?: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
		export interface Index<G extends GrammarMap, K extends Under<'declaration.signature.index'> = 'declaration.signature.index'> extends SubKindOf<V.Declaration.Signature<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly indexType?: Slot<G, K, 'indexType', V.Identifier.Any<G> | V.Type.Any<G>>;
			readonly name?: Slot<G, K, 'name', V.Identifier.Any<G> | string>;
			readonly readonly?: Flag;
			readonly sign?: Slot<G, K, 'sign', string>;
			readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
		export namespace Index {
			export interface Mapped<G extends GrammarMap, K extends Under<'declaration.signature.index.mapped'> = 'declaration.signature.index.mapped'> extends SubKindOf<V.Declaration.Signature.Index<G, K>> {
				// claimed by t
				readonly $kind: K;
				readonly mappedTypeClause: Slot<G, K, 'mappedTypeClause', V.Clause.MappedType<G>>;
			}
		}
	}
}
