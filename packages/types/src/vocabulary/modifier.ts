import type { GrammarContext } from './context.ts';
import type { Beneath, SubKindOf } from './utils.ts';
import type * as V from './index.ts';

/** An access level: the path of a kind beneath `modifier.visibility`. */
export type AccessLevel = Beneath<V.Modifier.Visibility.Any<never>, 'modifier.visibility'>;

export interface Modifier<G extends GrammarContext<G>> {
	readonly $kind: 'modifier';
}

export namespace Modifier {
	export interface Visibility<G extends GrammarContext<G>> extends SubKindOf<V.Modifier<G>> {
		// claimed by t
		readonly $kind: 'modifier.visibility';
		readonly scope?: G['identifier'];
		// r only
	}
	export namespace Visibility {
		export interface Private<G extends GrammarContext<G>> extends SubKindOf<V.Modifier.Visibility<G>> {
			// claimed by rt
			readonly $kind: 'modifier.visibility.private';
		}
		export interface Protected<G extends GrammarContext<G>> extends SubKindOf<V.Modifier.Visibility<G>> {
			// claimed by t
			readonly $kind: 'modifier.visibility.protected';
		}
		export interface Public<G extends GrammarContext<G>> extends SubKindOf<V.Modifier.Visibility<G>> {
			// claimed by rt
			readonly $kind: 'modifier.visibility.public';
		}
		export namespace Public {
			export interface Internal<G extends GrammarContext<G>> extends SubKindOf<V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $kind: 'modifier.visibility.public.internal';
			}
			export interface Restricted<G extends GrammarContext<G>> extends SubKindOf<V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $kind: 'modifier.visibility.public.restricted';
				readonly scope: G['identifier'];
			}
		}
	}
}
