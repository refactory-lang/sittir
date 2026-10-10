import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Function {
		export interface Generator<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Function<G>> {
			readonly $kind: 'declaration.function.generator';
			readonly body: V.Statement.Block<G>;
			readonly generator?: boolean;
			readonly name: G['identifier'];
			readonly parameters: V.Declaration.Parameter.Any<G>[];
		}
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly generator?: boolean;
	}
}
