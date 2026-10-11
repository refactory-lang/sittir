import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace Number {
		export interface Float<G extends GrammarContext<G>> {
			readonly imaginary?: G['slots']['literal.number.float']['imaginary'];
			// p only
		}
		export namespace Float {
			export interface LeadingPoint<G extends GrammarContext<G>> {
				readonly imaginary?: G['slots']['literal.number.float.leading_point']['imaginary'];
				// p only
			}
			export interface Scientific<G extends GrammarContext<G>> {
				readonly imaginary?: G['slots']['literal.number.float.scientific']['imaginary'];
				// p only
			}
		}
		export namespace Integer {
			export interface Imaginary<G extends GrammarContext<G>> extends SubKindOf<V.Literal.Number.Integer<G>> {
				// claimed by p
				readonly $kind: 'literal.number.integer.imaginary';
			}
		}
	}
}
