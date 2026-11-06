import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export interface Template<G extends GrammarMap> extends SubKindOf<V.Element<G>> {
		readonly $kind: 'element.template';
		readonly type: Slot<G, 'element.template', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		// t only
	}
	export namespace Template {
		export interface Substitution<G extends GrammarMap> extends SubKindOf<V.Element.Template<G>, 'type'> {
			// claimed by t
			readonly $kind: 'element.template.substitution';
			readonly type: Slot<G, 'element.template.substitution', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
	}
	export interface Tuple<G extends GrammarMap> extends SubKindOf<V.Element<G>> {
		readonly $kind: 'element.tuple';
		readonly name: Slot<G, 'element.tuple', 'name', V.Identifier.Any<G> | V.Pattern.Rest<G>>;
		// t only
		readonly type: Slot<G, 'element.tuple', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		// t only
	}
	export namespace Tuple {
		export interface Member<G extends GrammarMap> extends SubKindOf<V.Element.Tuple<G>, 'name' | 'type'> {
			// claimed by t
			readonly $kind: 'element.tuple.member';
			readonly name: Slot<G, 'element.tuple.member', 'name', V.Identifier.Any<G> | V.Pattern.Rest<G>>;
			readonly type: Slot<G, 'element.tuple.member', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
		export namespace Member {
			export interface Optional<G extends GrammarMap> extends SubKindOf<V.Element.Tuple.Member<G>, 'name' | 'type'> {
				// claimed by t
				readonly $kind: 'element.tuple.member.optional';
				readonly name: Slot<G, 'element.tuple.member.optional', 'name', V.Identifier.Any<G>>;
				readonly type: Slot<G, 'element.tuple.member.optional', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
			}
		}
	}
}
