import type { GrammarMap, Slot, Text } from '../../map.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Assignment<G extends GrammarMap> extends SubKindOf<V.Pattern<G>> {
		// claimed by t
		readonly $kind: 'pattern.assignment';
		readonly left: Slot<
			G,
			'pattern.assignment',
			'left',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Null.Undefined<G>
			| V.Pattern.Any<G>
		>;
		readonly right: Slot<
			G,
			'pattern.assignment',
			'right',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
		>;
	}
	export interface List<G extends GrammarMap> extends SubKindOf<V.Pattern<G>> {
		// claimed by prt
		readonly $kind: 'pattern.list';
		readonly elements?: Slot<G, 'pattern.list', 'elements', unknown>[];
	}
	export interface Object<G extends GrammarMap> extends SubKindOf<V.Pattern<G>> {
		// claimed by t
		readonly $kind: 'pattern.object';
		readonly properties?: Slot<G, 'pattern.object', 'properties', V.Identifier.Any<G> | V.Pattern.Any<G> | string>[];
	}
	export namespace Object {
		export interface Assignment<G extends GrammarMap> extends SubKindOf<V.Pattern.Object<G>> {
			// claimed by t
			readonly $kind: 'pattern.object.assignment';
			readonly left: Slot<G, 'pattern.object.assignment', 'left', V.Identifier.Any<G> | V.Pattern.Any<G> | string>;
			readonly right: Slot<
				G,
				'pattern.object.assignment',
				'right',
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
		}
		export interface Pair<G extends GrammarMap> extends SubKindOf<V.Pattern.Object<G>> {
			// claimed by t
			readonly $kind: 'pattern.object.pair';
			readonly key: Slot<
				G,
				'pattern.object.pair',
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
				'pattern.object.pair',
				'value',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Null.Undefined<G>
				| V.Pattern.Any<G>
			>;
		}
	}
	export interface Rest<G extends GrammarMap> extends SubKindOf<V.Pattern<G>> {
		// claimed by pt
		readonly $kind: 'pattern.rest';
		readonly pattern: Slot<
			G,
			'pattern.rest',
			'pattern',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Null.Undefined<G>
			| V.Pattern.Any<G>
			| string
		>;
	}
	export namespace Rest {
		export interface Map<G extends GrammarMap> extends SubKindOf<V.Pattern.Rest<G>> {
			// claimed by p
			readonly $kind: 'pattern.rest.map';
		}
	}
	export interface Tuple<G extends GrammarMap> extends SubKindOf<V.Pattern<G>> {
		// claimed by pr
		readonly $kind: 'pattern.tuple';
		readonly elements?: Slot<
			G,
			'pattern.tuple',
			'elements',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Type.Primitive<G>
		>[];
	}
	export namespace Tuple {
		export interface Bare<G extends GrammarMap> extends SubKindOf<V.Pattern.Tuple<G>> {
			// claimed by p
			readonly $kind: 'pattern.tuple.bare';
			readonly trailingComma?: Flag;
		}
	}
	// claimed by r
	export type Wildcard<G extends GrammarMap> = Text<G, 'pattern.wildcard'>;
}
