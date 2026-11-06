import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export interface Template<G extends GrammarMap, K extends Under<'element.template'> = 'element.template'> extends SubKindOf<V.Element<G, K>> {
		readonly $kind: K;
		readonly type: Slot<G, 'element.template', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		// t only
	}
	export namespace Template {
		export interface Substitution<G extends GrammarMap, K extends Under<'element.template.substitution'> = 'element.template.substitution'> extends SubKindOf<V.Element.Template<G, K>, 'type'> {
			// claimed by t
			readonly $kind: K;
			readonly type: Slot<G, 'element.template.substitution', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
	}
	export interface Tuple<G extends GrammarMap, K extends Under<'element.tuple'> = 'element.tuple'> extends SubKindOf<V.Element<G, K>> {
		readonly $kind: K;
		readonly name: Slot<G, 'element.tuple', 'name', V.Identifier.Any<G> | V.Pattern.Rest<G>>;
		// t only
		readonly type: Slot<G, 'element.tuple', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		// t only
	}
	export namespace Tuple {
		export interface Member<G extends GrammarMap, K extends Under<'element.tuple.member'> = 'element.tuple.member'> extends SubKindOf<V.Element.Tuple<G, K>, 'name' | 'type'> {
			// claimed by t
			readonly $kind: K;
			readonly name: Slot<G, 'element.tuple.member', 'name', V.Identifier.Any<G> | V.Pattern.Rest<G>>;
			readonly type: Slot<G, 'element.tuple.member', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
		export namespace Member {
			export interface Optional<G extends GrammarMap, K extends Under<'element.tuple.member.optional'> = 'element.tuple.member.optional'> extends SubKindOf<V.Element.Tuple.Member<G, K>, 'name' | 'type'> {
				// claimed by t
				readonly $kind: K;
				readonly name: Slot<G, 'element.tuple.member.optional', 'name', V.Identifier.Any<G>>;
				readonly type: Slot<G, 'element.tuple.member.optional', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
			}
		}
	}
}
