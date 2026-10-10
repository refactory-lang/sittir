import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Captured<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		readonly $kind: 'pattern.captured';
		readonly name: G['identifier'];
		readonly pattern: G['slots']['pattern.captured']['pattern'];
	}
	export interface Case<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		readonly $kind: 'pattern.case';
		readonly content?: G['slots']['pattern.case']['content'];
	}
	export namespace Case {
		export interface As<G extends GrammarContext> extends SubKindOf<V.Pattern.Case<G>> {
			readonly $kind: 'pattern.case.as';
			readonly casePattern: V.Pattern.Case<G>;
			readonly identifier: G['identifier'];
		}
		export interface Class<G extends GrammarContext> extends SubKindOf<V.Pattern.Case<G>> {
			readonly $kind: 'pattern.case.class';
			readonly arguments?: V.Pattern.Case<G>[];
			readonly name: V.Identifier.Dotted<G>;
		}
		export interface Dictionary<G extends GrammarContext> extends SubKindOf<V.Pattern.Case<G>> {
			readonly $kind: 'pattern.case.dictionary';
			readonly elements?: G['slots']['pattern.case.dictionary']['elements'][];
		}
		export interface Keyword<G extends GrammarContext> extends SubKindOf<V.Pattern.Case<G>> {
			readonly $kind: 'pattern.case.keyword';
			readonly name: G['identifier'];
			readonly value: G['slots']['pattern.case.keyword']['value'];
		}
		export interface List<G extends GrammarContext> extends SubKindOf<V.Pattern.Case<G>> {
			readonly $kind: 'pattern.case.list';
			readonly listPatternCasePatterns?: V.Pattern.Case<G>[];
		}
		export interface Or<G extends GrammarContext> extends SubKindOf<V.Pattern.Case<G>> {
			readonly $kind: 'pattern.case.or';
			readonly patterns: G['slots']['pattern.case.or']['patterns'][];
		}
		export interface Splat<G extends GrammarContext> extends SubKindOf<V.Pattern.Case<G>> {
			readonly $kind: 'pattern.case.splat';
			readonly name: G['identifier'];
			readonly operator: G['slots']['pattern.case.splat']['operator'];
		}
		export interface Tuple<G extends GrammarContext> extends SubKindOf<V.Pattern.Case<G>> {
			readonly $kind: 'pattern.case.tuple';
			readonly listPatternCasePatterns?: V.Pattern.Case<G>[];
		}
	}
	export interface Match<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		readonly $kind: 'pattern.match';
		readonly condition?: G['slots']['pattern.match']['condition'];
		readonly pattern: G['slots']['pattern.match']['pattern'];
	}
	export interface Or<G extends GrammarContext> extends SubKindOf<V.Pattern<G>> {
		readonly $kind: 'pattern.or';
	}
}
