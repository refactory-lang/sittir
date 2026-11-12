import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Complex<G extends GrammarMap, K extends Under<'pattern.complex'> = 'pattern.complex'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by p
		readonly $path: K;
		readonly imaginary:
			Slot<
			G,
			K,
			'imaginary',
			| V.Literal.Number.Float.Any<G>
			| V.Literal.Number.Integer<G>
			| V.Literal.Number.Integer.Big<G>
			| V.Literal.Number.Integer.Big.Binary<G>
			| V.Literal.Number.Integer.Big.Hex<G>
			| V.Literal.Number.Integer.Big.Octal<G>
			| V.Literal.Number.Integer.Binary<G>
			| V.Literal.Number.Integer.Hex<G>
			| V.Literal.Number.Integer.Imaginary<G>
			| V.Literal.Number.Integer.Octal<G>
		>;
		readonly real:
			Slot<
			G,
			K,
			'real',
			| V.Literal.Number.Float.Any<G>
			| V.Literal.Number.Integer<G>
			| V.Literal.Number.Integer.Big<G>
			| V.Literal.Number.Integer.Big.Binary<G>
			| V.Literal.Number.Integer.Big.Hex<G>
			| V.Literal.Number.Integer.Big.Octal<G>
			| V.Literal.Number.Integer.Binary<G>
			| V.Literal.Number.Integer.Hex<G>
			| V.Literal.Number.Integer.Imaginary<G>
			| V.Literal.Number.Integer.Octal<G>
		>;
		readonly sign?: Flag;
	}
	export namespace Complex {
		export interface Add<G extends GrammarMap, K extends Under<'pattern.complex.add'> = 'pattern.complex.add'> extends SubKindOf<V.Pattern.Complex<G, K>> {
			// claimed by p
			readonly $path: K;
		}
		export interface Subtract<G extends GrammarMap, K extends Under<'pattern.complex.subtract'> = 'pattern.complex.subtract'> extends SubKindOf<V.Pattern.Complex<G, K>> {
			// claimed by p
			readonly $path: K;
		}
	}
}
