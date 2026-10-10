import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export interface Template<G extends GrammarContext> extends SubKindOf<V.Element<G>> {
		readonly $kind: 'element.template';
		readonly type: G['slots']['element.template']['type'];
	}
	export namespace Template {
		export interface Substitution<G extends GrammarContext> extends SubKindOf<V.Element.Template<G>> {
			readonly $kind: 'element.template.substitution';
			readonly type: G['slots']['element.template.substitution']['type'];
		}
	}
	export interface Tuple<G extends GrammarContext> extends SubKindOf<V.Element<G>> {
		readonly $kind: 'element.tuple';
		readonly name: G['slots']['element.tuple']['name'];
		readonly type: G['slots']['element.tuple']['type'];
	}
	export namespace Tuple {
		export interface Member<G extends GrammarContext> extends SubKindOf<V.Element.Tuple<G>> {
			readonly $kind: 'element.tuple.member';
			readonly name: G['slots']['element.tuple.member']['name'];
			readonly type: G['slots']['element.tuple.member']['type'];
		}
		export namespace Member {
			export interface Optional<G extends GrammarContext> extends SubKindOf<V.Element.Tuple.Member<G>> {
				readonly $kind: 'element.tuple.member.optional';
				readonly name: G['identifier'];
				readonly type: G['slots']['element.tuple.member.optional']['type'];
			}
		}
	}
}
