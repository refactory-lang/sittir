import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Pattern<G extends GrammarContext> {
	readonly $kind: 'pattern';
}

export namespace Pattern {
	export interface Array<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by t
		readonly $kind: 'pattern.array';
		readonly elements?: G['slots']['pattern.array']['elements'][];
	}
	export interface As<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by p
		readonly $kind: 'pattern.as';
		readonly alias: G['slots']['pattern.as']['alias'];
		readonly expression: G['slots']['pattern.as']['expression'];
	}
	export interface Assignment<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by t
		readonly $kind: 'pattern.assignment';
		readonly left: G['slots']['pattern.assignment']['left'];
		readonly right: G['slots']['pattern.assignment']['right'];
	}
	export interface Captured<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.captured';
		readonly name: G['identifier'];
		readonly pattern: G['slots']['pattern.captured']['pattern'];
	}
	export interface Case<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by p
		readonly $kind: 'pattern.case';
		readonly content?: G['slots']['pattern.case']['content'];
	}
	export namespace Case {
		export interface As<G extends GrammarContext> extends SubKindOf<V.Pattern.Case<G>> {
			// claimed by p
			readonly $kind: 'pattern.case.as';
			readonly casePattern: V.Pattern.Case<G>;
			readonly identifier: G['identifier'];
		}
		export interface Class<G extends GrammarContext> extends SubKindOf<V.Pattern.Case<G>> {
			// claimed by p
			readonly $kind: 'pattern.case.class';
			readonly arguments?: V.Pattern.Case<G>[];
			readonly name: V.Identifier.Dotted<G>;
		}
		export interface Complex<G extends GrammarContext> extends SubKindOf<V.Pattern.Case<G>> {
			// claimed by p
			readonly $kind: 'pattern.case.complex';
			readonly imaginary: V.Literal.Number.Any<G>;
			readonly operator: G['slots']['pattern.case.complex']['operator'];
			readonly real: V.Literal.Number.Any<G>;
			readonly sign?: boolean;
		}
		export interface Dictionary<G extends GrammarContext> extends SubKindOf<V.Pattern.Case<G>> {
			// claimed by p
			readonly $kind: 'pattern.case.dictionary';
			readonly elements?: G['slots']['pattern.case.dictionary']['elements'][];
		}
		export interface Keyword<G extends GrammarContext> extends SubKindOf<V.Pattern.Case<G>> {
			// claimed by p
			readonly $kind: 'pattern.case.keyword';
			readonly name: G['identifier'];
			readonly value: G['slots']['pattern.case.keyword']['value'];
		}
		export interface List<G extends GrammarContext> extends SubKindOf<V.Pattern.Case<G>> {
			// claimed by p
			readonly $kind: 'pattern.case.list';
			readonly listPatternCasePatterns?: V.Pattern.Case<G>[];
		}
		export interface Or<G extends GrammarContext> extends SubKindOf<V.Pattern.Case<G>> {
			// claimed by p
			readonly $kind: 'pattern.case.or';
			readonly patterns: G['slots']['pattern.case.or']['patterns'][];
		}
		export interface Splat<G extends GrammarContext> extends SubKindOf<V.Pattern.Case<G>> {
			// claimed by p
			readonly $kind: 'pattern.case.splat';
			readonly name: G['identifier'];
			readonly operator: G['slots']['pattern.case.splat']['operator'];
		}
		export interface Tuple<G extends GrammarContext> extends SubKindOf<V.Pattern.Case<G>> {
			// claimed by p
			readonly $kind: 'pattern.case.tuple';
			readonly listPatternCasePatterns?: V.Pattern.Case<G>[];
		}
		export type Any<G extends GrammarContext> =
			| V.Pattern.Case<G>
			| V.Pattern.Case.As<G>
			| V.Pattern.Case.Class<G>
			| V.Pattern.Case.Complex<G>
			| V.Pattern.Case.Dictionary<G>
			| V.Pattern.Case.Keyword<G>
			| V.Pattern.Case.List<G>
			| V.Pattern.Case.Or<G>
			| V.Pattern.Case.Splat<G>
			| V.Pattern.Case.Tuple<G>;
	}
	export interface Generic<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.generic';
		readonly name: G['identifier'];
		readonly typeArguments: V.Element.TypeArgument<G>[];
	}
	export interface List<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by p
		readonly $kind: 'pattern.list';
		readonly patterns?: G['slots']['pattern.list']['patterns'][];
	}
	export interface Match<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.match';
		readonly condition?: G['slots']['pattern.match']['condition'];
		readonly pattern: G['slots']['pattern.match']['pattern'];
	}
	export interface Mutable<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.mutable';
		readonly pattern: G['slots']['pattern.mutable']['pattern'];
	}
	export interface Object<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by t
		readonly $kind: 'pattern.object';
		readonly properties?: G['slots']['pattern.object']['properties'][];
	}
	export namespace Object {
		export interface Assignment<G extends GrammarContext> extends SubKindOf<V.Pattern.Object<G>> {
			// claimed by t
			readonly $kind: 'pattern.object.assignment';
			readonly left: G['slots']['pattern.object.assignment']['left'];
			readonly right: G['slots']['pattern.object.assignment']['right'];
		}
		export interface Pair<G extends GrammarContext> extends SubKindOf<V.Pattern.Object<G>> {
			// claimed by t
			readonly $kind: 'pattern.object.pair';
			readonly key: G['slots']['pattern.object.pair']['key'];
			readonly value: G['slots']['pattern.object.pair']['value'];
		}
		export type Any<G extends GrammarContext> =
			| V.Pattern.Object<G>
			| V.Pattern.Object.Assignment<G>
			| V.Pattern.Object.Pair<G>;
	}
	export interface Or<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.or';
	}
	export interface Range<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.range';
	}
	export interface Reference<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.reference';
		readonly pattern: G['slots']['pattern.reference']['pattern'];
	}
	export namespace Reference {
		export interface Value<G extends GrammarContext> extends SubKindOf<V.Pattern.Reference<G>> {
			// claimed by r
			readonly $kind: 'pattern.reference.value';
			readonly mutable?: boolean;
			readonly pattern: G['slots']['pattern.reference.value']['pattern'];
		}
		export type Any<G extends GrammarContext> = V.Pattern.Reference<G> | V.Pattern.Reference.Value<G>;
	}
	export interface Rest<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by t
		readonly $kind: 'pattern.rest';
		readonly lhsExpression: G['slots']['pattern.rest']['lhsExpression'];
	}
	export interface Slice<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.slice';
		readonly patterns?: G['slots']['pattern.slice']['patterns'][];
	}
	export interface Splat<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by p
		readonly $kind: 'pattern.splat';
		readonly target: G['slots']['pattern.splat']['target'];
	}
	export namespace Splat {
		export interface Dictionary<G extends GrammarContext> extends SubKindOf<V.Pattern.Splat<G>> {
			// claimed by p
			readonly $kind: 'pattern.splat.dictionary';
			readonly target: G['slots']['pattern.splat.dictionary']['target'];
		}
		export type Any<G extends GrammarContext> = V.Pattern.Splat<G> | V.Pattern.Splat.Dictionary<G>;
	}
	export interface Struct<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.struct';
		readonly fields?: V.Pattern.Struct.Any<G>[];
		readonly type?: V.Identifier.Type<G> | V.Type.Path<G>;
	}
	export namespace Struct {
		export interface Field<G extends GrammarContext> extends SubKindOf<V.Pattern.Struct<G>> {
			// claimed by r
			readonly $kind: 'pattern.struct.field';
		}
		export interface Rest<G extends GrammarContext> extends SubKindOf<V.Pattern.Struct<G>> {
			// claimed by r
			readonly $kind: 'pattern.struct.rest';
		}
		export type Any<G extends GrammarContext> =
			| V.Pattern.Struct<G>
			| V.Pattern.Struct.Field<G>
			| V.Pattern.Struct.Rest<G>;
	}
	export interface Tuple<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by pr
		readonly $kind: 'pattern.tuple';
		readonly elements?: G['slots']['pattern.tuple']['elements'][];
		// r only
		readonly patterns?: G['slots']['pattern.tuple']['patterns'][];
	}
	export namespace Tuple {
		export interface Bare<G extends GrammarContext> extends SubKindOf<V.Pattern.Tuple<G>> {
			// claimed by p
			readonly $kind: 'pattern.tuple.bare';
		}
		export interface Struct<G extends GrammarContext> extends SubKindOf<V.Pattern.Tuple<G>> {
			// claimed by r
			readonly $kind: 'pattern.tuple.struct';
			readonly patterns?: G['slots']['pattern.tuple.struct']['patterns'][];
			readonly type: G['slots']['pattern.tuple.struct']['type'];
		}
		export type Any<G extends GrammarContext> =
			| V.Pattern.Tuple<G>
			| V.Pattern.Tuple.Bare<G>
			| V.Pattern.Tuple.Struct<G>;
	}
	export interface Wildcard<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.wildcard';
	}
	export type Any<G extends GrammarContext> =
		| V.Pattern.Array<G>
		| V.Pattern.As<G>
		| V.Pattern.Assignment<G>
		| V.Pattern.Captured<G>
		| V.Pattern.Case<G>
		| V.Pattern.Case.As<G>
		| V.Pattern.Case.Class<G>
		| V.Pattern.Case.Complex<G>
		| V.Pattern.Case.Dictionary<G>
		| V.Pattern.Case.Keyword<G>
		| V.Pattern.Case.List<G>
		| V.Pattern.Case.Or<G>
		| V.Pattern.Case.Splat<G>
		| V.Pattern.Case.Tuple<G>
		| V.Pattern.Generic<G>
		| V.Pattern.List<G>
		| V.Pattern.Match<G>
		| V.Pattern.Mutable<G>
		| V.Pattern.Object<G>
		| V.Pattern.Object.Assignment<G>
		| V.Pattern.Object.Pair<G>
		| V.Pattern.Or<G>
		| V.Pattern.Range<G>
		| V.Pattern.Reference<G>
		| V.Pattern.Reference.Value<G>
		| V.Pattern.Rest<G>
		| V.Pattern.Slice<G>
		| V.Pattern.Splat<G>
		| V.Pattern.Splat.Dictionary<G>
		| V.Pattern.Struct<G>
		| V.Pattern.Struct.Field<G>
		| V.Pattern.Struct.Rest<G>
		| V.Pattern.Tuple<G>
		| V.Pattern.Tuple.Bare<G>
		| V.Pattern.Tuple.Struct<G>
		| V.Pattern.Wildcard<G>;
}
