import type { GrammarMap } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Complex<G extends GrammarMap> extends SubKindOf<V.Pattern<G>> {
		// claimed by p
		readonly $kind: 'pattern.complex';
		readonly imaginary:
			| V.Literal.Number.Float.Any<G>
			| V.Literal.Number.Integer<G>
			| V.Literal.Number.Integer.Big<G>
			| V.Literal.Number.Integer.Binary<G>
			| V.Literal.Number.Integer.Hex<G>
			| V.Literal.Number.Integer.Imaginary<G>
			| V.Literal.Number.Integer.Octal<G>;
		readonly real:
			| V.Literal.Number.Float.Any<G>
			| V.Literal.Number.Integer<G>
			| V.Literal.Number.Integer.Big<G>
			| V.Literal.Number.Integer.Binary<G>
			| V.Literal.Number.Integer.Hex<G>
			| V.Literal.Number.Integer.Imaginary<G>
			| V.Literal.Number.Integer.Octal<G>;
		readonly sign?: boolean;
	}
	export namespace Complex {
		export interface Add<G extends GrammarMap> extends SubKindOf<V.Pattern.Complex<G>> {
			// claimed by p
			readonly $kind: 'pattern.complex.add';
		}
		export interface Subtract<G extends GrammarMap> extends SubKindOf<V.Pattern.Complex<G>> {
			// claimed by p
			readonly $kind: 'pattern.complex.subtract';
		}
	}
}
