import type { GrammarMap } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export interface Regex<G extends GrammarMap> extends SubKindOf<V.Literal<G>> {
		// claimed by t
		readonly $kind: 'literal.regex';
		readonly flags?: V.Literal.Regex.Flags<G>;
		readonly pattern?: V.Literal.Regex.Pattern<G>;
	}
	export namespace Regex {
		export interface Flags<G extends GrammarMap> extends SubKindOf<V.Literal.Regex<G>> {
			// claimed by t
			readonly $kind: 'literal.regex.flags';
		}
		export interface Pattern<G extends GrammarMap> extends SubKindOf<V.Literal.Regex<G>> {
			// claimed by t
			readonly $kind: 'literal.regex.pattern';
		}
	}
}
