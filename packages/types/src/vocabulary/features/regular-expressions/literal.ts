import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export interface Regex<G extends GrammarMap, K extends Under<'literal.regex'> = 'literal.regex'> extends SubKindOf<V.Literal<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly flags?: Slot<G, K, 'flags', V.Literal.Regex.Flags<G>>;
		readonly pattern?: Slot<G, K, 'pattern', V.Literal.Regex.Pattern<G>>;
	}
	export namespace Regex {
		export interface Flags<G extends GrammarMap, K extends Under<'literal.regex.flags'> = 'literal.regex.flags'> extends SubKindOf<V.Literal.Regex<G, K>> {
			// claimed by t
			readonly $kind: K;
		}
		export interface Pattern<G extends GrammarMap, K extends Under<'literal.regex.pattern'> = 'literal.regex.pattern'> extends SubKindOf<V.Literal.Regex<G, K>> {
			// claimed by t
			readonly $kind: K;
		}
	}
}
