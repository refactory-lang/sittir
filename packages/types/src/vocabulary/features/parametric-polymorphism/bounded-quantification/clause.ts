import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Clause {
	export interface Bounds<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.bounds';
		readonly bounds?: G['slots']['clause.bounds']['bounds'][];
	}
	export namespace Bounds {
		export interface Removed<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Bounds<G>> {
			readonly $kind: 'clause.bounds.removed';
			readonly type: G['slots']['clause.bounds.removed']['type'];
		}
		export interface Use<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Bounds<G>> {
			readonly $kind: 'clause.bounds.use';
			readonly bounds?: G['identifier'][];
		}
	}
	export interface Constraint<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.constraint';
		readonly content: G['slots']['clause.constraint']['content'];
		readonly type: G['slots']['clause.constraint']['type'];
	}
	export interface Where<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.where';
		readonly wherePredicates?: V.Clause.Where.Predicate<G>[];
	}
	export namespace Where {
		export interface Predicate<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Where<G>> {
			readonly $kind: 'clause.where.predicate';
			readonly bounds: V.Clause.Bounds<G>;
			readonly left: G['slots']['clause.where.predicate']['left'];
		}
	}
}
