import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace Number {
		export interface Float<G extends GrammarContext> {
			readonly imaginary?: G['slots']['literal.number.float']['imaginary'];
		}
		export namespace Float {
			export interface LeadingPoint<G extends GrammarContext> {
				readonly imaginary?: G['slots']['literal.number.float.leading_point']['imaginary'];
			}
			export interface Scientific<G extends GrammarContext> {
				readonly imaginary?: G['slots']['literal.number.float.scientific']['imaginary'];
			}
		}
		export namespace Integer {
			export interface Imaginary<G extends GrammarContext> extends SubKindOf<V.Literal.Number.Integer<G>> {
				readonly $kind: 'literal.number.integer.imaginary';
			}
		}
	}
}
