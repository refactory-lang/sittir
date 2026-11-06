import type { GrammarMap, Slot, Text } from '../../../map.ts';
import type { Flagged, SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Type {
	export interface Conditional<G extends GrammarMap, K extends Under<'type.conditional'> = 'type.conditional'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly alternative: Slot<G, K, 'alternative', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly consequence: Slot<G, K, 'consequence', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly left: Slot<G, K, 'left', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly right: Slot<G, K, 'right', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	// claimed by t
	export type Existential<G extends GrammarMap> = Text<G, 'type.existential'>;
	export namespace Function {
		export interface Constructor<G extends GrammarMap, K extends Under<'type.function.constructor'> = 'type.function.constructor'> extends SubKindOf<V.Type.Function<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly parameters: Slot<
				G,
				K,
				'parameters',
				| V.Declaration.Parameter<G>
				| V.Declaration.Parameter.Private<G>
				| V.Declaration.Parameter.Protected<G>
				| V.Declaration.Parameter.Public<G>
				| V.Declaration.Parameter.Receiver<G>
			>[];
			readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
		}
	}
	export interface IndexQuery<G extends GrammarMap, K extends Under<'type.index_query'> = 'type.index_query'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Infer<G extends GrammarMap, K extends Under<'type.infer'> = 'type.infer'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		readonly type?: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Intersection<G extends GrammarMap, K extends Under<'type.intersection'> = 'type.intersection'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly left?: Slot<G, K, 'left', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly right: Slot<G, K, 'right', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Literal<G extends GrammarMap, K extends Under<'type.literal'> = 'type.literal'> extends SubKindOf<V.Type<G, K>, 'content'> {
		// claimed by t
		readonly $path: K;
		readonly content: Slot<G, K, 'content', unknown>;
	}
	export interface Lookup<G extends GrammarMap, K extends Under<'type.lookup'> = 'type.lookup'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly indexType: Slot<G, K, 'indexType', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Object<G extends GrammarMap, K extends Under<'type.object'> = 'type.object'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly closing: Slot<G, K, 'closing', string>;
		readonly members?: Slot<G, K, 'members', V.Declaration.Any<G> | V.Statement.Export.Any<G>>[];
		readonly opening: Slot<G, K, 'opening', string>;
	}
	export interface Optional<G extends GrammarMap, K extends Under<'type.optional'> = 'type.optional'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Parenthesized<G extends GrammarMap, K extends Under<'type.parenthesized'> = 'type.parenthesized'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Predicate<G extends GrammarMap, K extends Under<'type.predicate'> = 'type.predicate'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly name?: Slot<G, K, 'name', V.Identifier.Any<G> | V.Type.Primitive<G>>;
		readonly type?: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export namespace Predicate {
		export interface Asserts<G extends GrammarMap, K extends Under<'type.predicate.asserts'> = 'type.predicate.asserts'> extends SubKindOf<V.Type.Predicate<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly value: Slot<G, K, 'value', V.Identifier.Any<G> | V.Type.Predicate<G>>;
		}
	}
	export namespace Primitive {
		// claimed by t
		export type Object<G extends GrammarMap> = Text<G, 'type.primitive.object'>;
		// claimed by t
		export type Symbol<G extends GrammarMap> = Flagged<Text<G, 'type.primitive.symbol'>, 'unique'>;
		// claimed by t
		export type Unchecked<G extends GrammarMap> = Text<G, 'type.primitive.unchecked'>;
		// claimed by t
		export type Unknown<G extends GrammarMap> = Text<G, 'type.primitive.unknown'>;
		// claimed by t
		export type Void<G extends GrammarMap> = Text<G, 'type.primitive.void'>;
	}
	export interface Query<G extends GrammarMap, K extends Under<'type.query'> = 'type.query'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly expression: Slot<G, K, 'expression', unknown>;
	}
	export interface Readonly<G extends GrammarMap, K extends Under<'type.readonly'> = 'type.readonly'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Template<G extends GrammarMap, K extends Under<'type.template'> = 'type.template'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly elements?: Slot<G, K, 'elements', unknown>[];
	}
}
