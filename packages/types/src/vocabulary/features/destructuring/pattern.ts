import type { GrammarMap, Slot, Text } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Assignment<G extends GrammarMap, K extends Under<'pattern.assignment'> = 'pattern.assignment'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly left: Slot<
			G,
			K,
			'left',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Null.Undefined<G>
			| V.Pattern.Any<G>
		>;
		readonly right: Slot<
			G,
			K,
			'right',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
		>;
	}
	export interface List<G extends GrammarMap, K extends Under<'pattern.list'> = 'pattern.list'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by prt
		readonly $kind: K;
		readonly elements?: Slot<G, K, 'elements', unknown>[];
	}
	export interface Object<G extends GrammarMap, K extends Under<'pattern.object'> = 'pattern.object'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly properties?: Slot<G, K, 'properties', V.Identifier.Any<G> | V.Pattern.Any<G> | string>[];
	}
	export namespace Object {
		export interface Assignment<G extends GrammarMap, K extends Under<'pattern.object.assignment'> = 'pattern.object.assignment'> extends SubKindOf<V.Pattern.Object<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly left: Slot<G, K, 'left', V.Identifier.Any<G> | V.Pattern.Any<G> | string>;
			readonly right: Slot<
				G,
				K,
				'right',
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
		}
		export interface Pair<G extends GrammarMap, K extends Under<'pattern.object.pair'> = 'pattern.object.pair'> extends SubKindOf<V.Pattern.Object<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly key: Slot<
				G,
				K,
				'key',
				| V.Expression.Any<G>
				| V.Literal.Any<G>
				| V.Identifier<G>
				| string
				| V.Declaration.Module<G>
				| V.Identifier.Any<G>
			>;
			readonly value?: Slot<
				G,
				K,
				'value',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Null.Undefined<G>
				| V.Pattern.Any<G>
			>;
		}
	}
	export interface Rest<G extends GrammarMap, K extends Under<'pattern.rest'> = 'pattern.rest'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by pt
		readonly $kind: K;
		readonly pattern: Slot<
			G,
			K,
			'pattern',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Null.Undefined<G>
			| V.Pattern.Any<G>
			| string
		>;
	}
	export namespace Rest {
		export interface Map<G extends GrammarMap, K extends Under<'pattern.rest.map'> = 'pattern.rest.map'> extends SubKindOf<V.Pattern.Rest<G, K>> {
			// claimed by p
			readonly $kind: K;
		}
	}
	export interface Tuple<G extends GrammarMap, K extends Under<'pattern.tuple'> = 'pattern.tuple'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by pr
		readonly $kind: K;
		readonly elements?: Slot<
			G,
			K,
			'elements',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Type.Primitive<G>
		>[];
	}
	export namespace Tuple {
		export interface Bare<G extends GrammarMap, K extends Under<'pattern.tuple.bare'> = 'pattern.tuple.bare'> extends SubKindOf<V.Pattern.Tuple<G, K>> {
			// claimed by p
			readonly $kind: K;
			readonly trailingComma?: Flag;
		}
	}
	// claimed by r
	export type Wildcard<G extends GrammarMap> = Text<G, 'pattern.wildcard'>;
}
