import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Complex<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		// claimed by p
		readonly $kind: 'pattern.complex';
		readonly imaginary: V.Literal.Number.Any<G>;
		readonly real: V.Literal.Number.Any<G>;
		readonly sign?: boolean;
	}
	export namespace Complex {
		export interface Add<G extends GrammarContext<G>> extends SubKindOf<V.Pattern.Complex<G>> {
			// claimed by p
			readonly $kind: 'pattern.complex.add';
		}
		export interface Subtract<G extends GrammarContext<G>> extends SubKindOf<V.Pattern.Complex<G>> {
			// claimed by p
			readonly $kind: 'pattern.complex.subtract';
		}
	}
}
