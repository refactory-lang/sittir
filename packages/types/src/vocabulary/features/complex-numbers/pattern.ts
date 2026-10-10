import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export namespace Case {
		export interface Complex<G extends GrammarContext<G>> extends SubKindOf<V.Pattern.Case<G>> {
			readonly $kind: 'pattern.case.complex';
			readonly imaginary: V.Literal.Number.Any<G>;
			readonly operator: G['slots']['pattern.case.complex']['operator'];
			readonly real: V.Literal.Number.Any<G>;
			readonly sign?: boolean;
		}
	}
}
