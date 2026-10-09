import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Clause {
	export namespace Bounds {
		export interface HigherRanked<G extends GrammarContext> extends SubKindOf<V.Clause.Bounds<G>> {
			readonly $kind: 'clause.bounds.higher_ranked';
			readonly type: G['slots']['clause.bounds.higher_ranked']['type'];
			readonly typeParameters: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		}
	}
}
