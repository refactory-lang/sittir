import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Signature<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		readonly $kind: 'declaration.signature';
	}
	export namespace Signature {
		export interface Call<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Signature<G>> {
			readonly $kind: 'declaration.signature.call';
			readonly parameters: V.Declaration.Parameter.Any<G>[];
			readonly returnType?: G['slots']['declaration.signature.call']['returnType'];
		}
		export interface Construct<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Signature<G>> {
			readonly $kind: 'declaration.signature.construct';
			readonly parameters: V.Declaration.Parameter.Any<G>[];
			readonly type?: G['slots']['declaration.signature.construct']['type'];
		}
		export interface Index<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Signature<G>> {
			readonly $kind: 'declaration.signature.index';
		}
	}
}
