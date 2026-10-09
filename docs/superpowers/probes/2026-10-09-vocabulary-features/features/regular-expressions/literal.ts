import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export interface Regex<G extends GrammarContext> extends SubKindOf<V.Literal<G>> {
		readonly $kind: 'literal.regex';
		readonly flags?: V.Literal.Regex.Flags<G>;
		readonly pattern?: V.Literal.Regex.Pattern<G>;
	}
	export namespace Regex {
		export interface Flags<G extends GrammarContext> extends SubKindOf<V.Literal.Regex<G>> {
			readonly $kind: 'literal.regex.flags';
		}
		export interface Pattern<G extends GrammarContext> extends SubKindOf<V.Literal.Regex<G>> {
			readonly $kind: 'literal.regex.pattern';
		}
	}
}
