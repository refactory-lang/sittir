import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Modifier<G extends GrammarContext<G>> {
	readonly $kind: 'modifier';
}

export namespace Modifier {
	export interface Extern<G extends GrammarContext<G>> extends SubKindOf<V.Modifier<G>> {
		// claimed by r
		readonly $kind: 'modifier.extern';
		readonly abi?: V.Literal.String<G>;
	}
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
			export type Any<G extends GrammarContext<G>> =
				| V.Modifier.Visibility.Public<G>
				| V.Modifier.Visibility.Public.Internal<G>
				| V.Modifier.Visibility.Public.Restricted<G>;
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Modifier.Visibility<G>
			| V.Modifier.Visibility.Private<G>
			| V.Modifier.Visibility.Protected<G>
			| V.Modifier.Visibility.Public<G>
			| V.Modifier.Visibility.Public.Internal<G>
			| V.Modifier.Visibility.Public.Restricted<G>;
	}
	export type Any<G extends GrammarContext<G>> =
		| V.Modifier.Extern<G>
		| V.Modifier.Visibility<G>
		| V.Modifier.Visibility.Private<G>
		| V.Modifier.Visibility.Protected<G>
		| V.Modifier.Visibility.Public<G>
		| V.Modifier.Visibility.Public.Internal<G>
		| V.Modifier.Visibility.Public.Restricted<G>;
}
