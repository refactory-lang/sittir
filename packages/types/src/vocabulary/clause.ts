import type { GrammarContext } from './context.ts';
import type { Flag, SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Clause<G extends GrammarContext<G>> {
	readonly $kind: 'clause';
}

export namespace Clause {
	export interface Bounds<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by r
		readonly $kind: 'clause.bounds';
		readonly bounds?: G['slots']['clause.bounds']['bounds'][];
	}
	export namespace Bounds {
		export interface HigherRanked<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Bounds<G>> {
			// claimed by r
			readonly $kind: 'clause.bounds.higher_ranked';
			readonly type: G['slots']['clause.bounds.higher_ranked']['type'];
			readonly typeParameters: (V.Identifier.Metavariable<G> | V.Declaration.TypeParameter.Any<G>)[];
		}
		export interface Removed<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Bounds<G>> {
			// claimed by r
			readonly $kind: 'clause.bounds.removed';
			readonly type: G['slots']['clause.bounds.removed']['type'];
		}
		export interface Use<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Bounds<G>> {
			// claimed by r
			readonly $kind: 'clause.bounds.use';
			readonly bounds?: G['identifier'][];
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Clause.Bounds<G>
			| V.Clause.Bounds.HigherRanked<G>
			| V.Clause.Bounds.Removed<G>
			| V.Clause.Bounds.Use<G>;
	}
	export interface Case<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by pt
		readonly $kind: 'clause.case';
		readonly bodies?: G['slots']['clause.case']['bodies'][];
		// t only
		readonly casePatterns?: V.Pattern.Case<G>[];
		// p only
		readonly consequence?: G['slots']['clause.case']['consequence'];
		// p only
		readonly guard?: V.Clause.Comprehension.If<G>;
		// p only
		readonly value?: G['slots']['clause.case']['value'];
		// t only
	}
	export namespace Case {
		export interface Default<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Case<G>> {
			// claimed by t
			readonly $kind: 'clause.case.default';
			readonly bodies?: G['slots']['clause.case.default']['bodies'][];
		}
		export type Any<G extends GrammarContext<G>> = V.Clause.Case<G> | V.Clause.Case.Default<G>;
	}
	export interface Catch<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by t
		readonly $kind: 'clause.catch';
		readonly body: V.Statement.Block<G>;
		readonly catchClauseGroup?: G['slots']['clause.catch']['catchClauseGroup'];
	}
	export interface Comprehension<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by p
		readonly $kind: 'clause.comprehension';
		readonly contents?: V.Clause.Comprehension.Any<G>[];
	}
	export namespace Comprehension {
		export interface For<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Comprehension<G>> {
			// claimed by p
			readonly $kind: 'clause.comprehension.for';
			readonly async?: Flag;
			readonly comma?: boolean;
			readonly left: G['slots']['clause.comprehension.for']['left'];
			readonly rights: G['slots']['clause.comprehension.for']['rights'][];
		}
		export interface If<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Comprehension<G>> {
			// claimed by p
			readonly $kind: 'clause.comprehension.if';
			readonly condition: G['slots']['clause.comprehension.if']['condition'];
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Clause.Comprehension<G>
			| V.Clause.Comprehension.For<G>
			| V.Clause.Comprehension.If<G>;
	}
	export interface Constraint<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by t
		readonly $kind: 'clause.constraint';
		readonly content: G['slots']['clause.constraint']['content'];
		readonly type: G['slots']['clause.constraint']['type'];
	}
	export interface Default<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by t
		readonly $kind: 'clause.default';
		readonly type: G['slots']['clause.default']['type'];
	}
	export interface Elif<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by p
		readonly $kind: 'clause.elif';
		readonly condition: G['slots']['clause.elif']['condition'];
		readonly consequence: G['slots']['clause.elif']['consequence'];
	}
	export interface Else<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by prt
		readonly $kind: 'clause.else';
		readonly body: G['slots']['clause.else']['body'];
	}
	export interface Except<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by p
		readonly $kind: 'clause.except';
		readonly exception?: G['slots']['clause.except']['exception'] | G['slots']['clause.except']['exception'][];
		readonly group?: Flag;
		readonly suite: G['slots']['clause.except']['suite'];
	}
	export interface Export<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by t
		readonly $kind: 'clause.export';
		readonly exportSpecifiers?: V.Clause.Export.Specifier<G>[];
	}
	export namespace Export {
		export interface Namespace<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Export<G>> {
			// claimed by t
			readonly $kind: 'clause.export.namespace';
			readonly moduleExportName: G['slots']['clause.export.namespace']['moduleExportName'];
		}
		export interface Specifier<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Export<G>> {
			// claimed by t
			readonly $kind: 'clause.export.specifier';
			readonly alias?: G['slots']['clause.export.specifier']['alias'];
			readonly exportKind?: G['slots']['clause.export.specifier']['exportKind'];
			readonly name: G['slots']['clause.export.specifier']['name'];
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Clause.Export<G>
			| V.Clause.Export.Namespace<G>
			| V.Clause.Export.Specifier<G>;
	}
	export interface Extends<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by t
		readonly $kind: 'clause.extends';
		readonly extendsClauseSingles?: G['slots']['clause.extends']['extendsClauseSingles'][];
	}
	export namespace Extends {
		export interface Type<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Extends<G>> {
			// claimed by t
			readonly $kind: 'clause.extends.type';
			readonly types: G['slots']['clause.extends.type']['types'][];
		}
		export type Any<G extends GrammarContext<G>> = V.Clause.Extends<G> | V.Clause.Extends.Type<G>;
	}
	export interface Finally<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by pt
		readonly $kind: 'clause.finally';
		readonly block?: G['slots']['clause.finally']['block'];
		// p only
		readonly body?: V.Statement.Block<G>;
		// t only
	}
	export interface Implements<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by t
		readonly $kind: 'clause.implements';
		readonly types: G['slots']['clause.implements']['types'][];
	}
	export interface Import<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.import';
	}
	export namespace Import {
		export interface Alias<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by pt
			readonly $kind: 'clause.import.alias';
			readonly alias?: G['identifier'];
			// p only
			readonly name: G['identifier'];
			readonly value?: G['identifier'];
			// t only
		}
		export interface As<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by r
			readonly $kind: 'clause.import.as';
			readonly alias: G['identifier'];
			readonly path: G['identifier'];
		}
		export interface Attribute<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by t
			readonly $kind: 'clause.import.attribute';
			readonly attributeKind: G['slots']['clause.import.attribute']['attributeKind'];
			readonly object: V.Expression.Collection.Object<G>;
		}
		export interface List<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by r
			readonly $kind: 'clause.import.list';
			readonly useClauses?: G['slots']['clause.import.list']['useClauses'][];
		}
		export namespace List {
			export interface Scoped<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import.List<G>> {
				// claimed by r
				readonly $kind: 'clause.import.list.scoped';
				readonly list: V.Clause.Import.List<G>;
				readonly path?: G['identifier'];
			}
			export type Any<G extends GrammarContext<G>> = V.Clause.Import.List<G> | V.Clause.Import.List.Scoped<G>;
		}
		export interface Names<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by t
			readonly $kind: 'clause.import.names';
			readonly content: G['slots']['clause.import.names']['content'] | G['slots']['clause.import.names']['content'][];
		}
		export interface Namespace<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by t
			readonly $kind: 'clause.import.namespace';
			readonly name: G['identifier'];
		}
		export interface Relative<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by p
			readonly $kind: 'clause.import.relative';
			readonly name?: V.Identifier.Dotted<G>;
			readonly prefix?: V.Clause.Import.Relative.Prefix<G>;
		}
		export namespace Relative {
			export interface Prefix<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import.Relative<G>> {
				// claimed by p
				readonly $kind: 'clause.import.relative.prefix';
			}
			export type Any<G extends GrammarContext<G>> = V.Clause.Import.Relative<G> | V.Clause.Import.Relative.Prefix<G>;
		}
		export interface Require<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by t
			readonly $kind: 'clause.import.require';
			readonly name: G['identifier'];
			readonly source: V.Literal.String<G>;
		}
		export interface Specifier<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by t
			readonly $kind: 'clause.import.specifier';
			readonly alias?: G['slots']['clause.import.specifier']['alias'];
			readonly importKind?: G['slots']['clause.import.specifier']['importKind'];
			readonly name: G['slots']['clause.import.specifier']['name'];
		}
		export interface Wildcard<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Import<G>> {
			// claimed by pr
			readonly $kind: 'clause.import.wildcard';
			readonly useWildcardGroup?: G['slots']['clause.import.wildcard']['useWildcardGroup'];
			// r only
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Clause.Import.Alias<G>
			| V.Clause.Import.As<G>
			| V.Clause.Import.Attribute<G>
			| V.Clause.Import.List<G>
			| V.Clause.Import.List.Scoped<G>
			| V.Clause.Import.Names<G>
			| V.Clause.Import.Namespace<G>
			| V.Clause.Import.Relative<G>
			| V.Clause.Import.Relative.Prefix<G>
			| V.Clause.Import.Require<G>
			| V.Clause.Import.Specifier<G>
			| V.Clause.Import.Wildcard<G>;
	}
	export interface Let<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by r
		readonly $kind: 'clause.let';
		readonly pattern?: G['slots']['clause.let']['pattern'];
		readonly value?: G['slots']['clause.let']['value'];
	}
	export namespace Let {
		export interface Chain<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Let<G>> {
			// claimed by r
			readonly $kind: 'clause.let.chain';
			readonly left: G['slots']['clause.let.chain']['left'];
			readonly rights?: G['slots']['clause.let.chain']['rights'][];
		}
		export type Any<G extends GrammarContext<G>> = V.Clause.Let<G> | V.Clause.Let.Chain<G>;
	}
	export interface Lifetimes<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by r
		readonly $kind: 'clause.lifetimes';
		readonly lifetimes: V.Identifier.Lifetime<G>[];
	}
	export interface Macro<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.macro';
		readonly left: V.Element.Macro.TokenTree.Pattern<G>;
		// r only
		readonly right: V.Element.Macro.TokenTree<G>;
		// r only
	}
	export namespace Macro {
		export interface Rule<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Macro<G>> {
			// claimed by r
			readonly $kind: 'clause.macro.rule';
			readonly left: V.Element.Macro.TokenTree.Pattern<G>;
			readonly right: V.Element.Macro.TokenTree<G>;
		}
		export type Any<G extends GrammarContext<G>> = V.Clause.Macro.Rule<G>;
	}
	export interface MappedType<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by t
		readonly $kind: 'clause.mapped_type';
		readonly alias?: G['slots']['clause.mapped_type']['alias'];
		readonly name: V.Identifier.Type<G>;
		readonly type: G['slots']['clause.mapped_type']['type'];
	}
	export interface Match<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.match';
	}
	export namespace Match {
		export interface Arm<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Match<G>> {
			// claimed by r
			readonly $kind: 'clause.match.arm';
			readonly attributes?: G['attribute'][];
			readonly pattern: V.Pattern.Match<G>;
			readonly value: G['slots']['clause.match.arm']['value'];
		}
		export namespace Arm {
			export interface Last<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Match.Arm<G>> {
				// claimed by r
				readonly $kind: 'clause.match.arm.last';
				readonly attributes?: G['attribute'][];
				readonly comma?: boolean;
				readonly pattern: V.Pattern.Match<G>;
				readonly value: G['slots']['clause.match.arm.last']['value'];
			}
			export type Any<G extends GrammarContext<G>> = V.Clause.Match.Arm<G> | V.Clause.Match.Arm.Last<G>;
		}
		export type Any<G extends GrammarContext<G>> = V.Clause.Match.Arm<G> | V.Clause.Match.Arm.Last<G>;
	}
	export interface Print<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		readonly $kind: 'clause.print';
		readonly expression: G['slots']['clause.print']['expression'];
		// p only
	}
	export namespace Print {
		export interface Chevron<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Print<G>> {
			// claimed by p
			readonly $kind: 'clause.print.chevron';
			readonly expression: G['slots']['clause.print.chevron']['expression'];
		}
		export type Any<G extends GrammarContext<G>> = V.Clause.Print.Chevron<G>;
	}
	export interface Where<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by r
		readonly $kind: 'clause.where';
		readonly wherePredicates?: V.Clause.Where.Predicate<G>[];
	}
	export namespace Where {
		export interface Predicate<G extends GrammarContext<G>> extends SubKindOf<V.Clause.Where<G>> {
			// claimed by r
			readonly $kind: 'clause.where.predicate';
			readonly bounds: V.Clause.Bounds<G>;
			readonly left: G['slots']['clause.where.predicate']['left'];
		}
		export type Any<G extends GrammarContext<G>> = V.Clause.Where<G> | V.Clause.Where.Predicate<G>;
	}
	export interface With<G extends GrammarContext<G>> extends SubKindOf<V.Clause<G>> {
		// claimed by p
		readonly $kind: 'clause.with';
		readonly items: V.Clause.With.Item<G>[];
	}
	export namespace With {
		export interface Item<G extends GrammarContext<G>> extends SubKindOf<V.Clause.With<G>> {
			// claimed by p
			readonly $kind: 'clause.with.item';
			readonly value: G['slots']['clause.with.item']['value'];
		}
		export type Any<G extends GrammarContext<G>> = V.Clause.With<G> | V.Clause.With.Item<G>;
	}
	export type Any<G extends GrammarContext<G>> =
		| V.Clause.Bounds<G>
		| V.Clause.Bounds.HigherRanked<G>
		| V.Clause.Bounds.Removed<G>
		| V.Clause.Bounds.Use<G>
		| V.Clause.Case<G>
		| V.Clause.Case.Default<G>
		| V.Clause.Catch<G>
		| V.Clause.Comprehension<G>
		| V.Clause.Comprehension.For<G>
		| V.Clause.Comprehension.If<G>
		| V.Clause.Constraint<G>
		| V.Clause.Default<G>
		| V.Clause.Elif<G>
		| V.Clause.Else<G>
		| V.Clause.Except<G>
		| V.Clause.Export<G>
		| V.Clause.Export.Namespace<G>
		| V.Clause.Export.Specifier<G>
		| V.Clause.Extends<G>
		| V.Clause.Extends.Type<G>
		| V.Clause.Finally<G>
		| V.Clause.Implements<G>
		| V.Clause.Import.Alias<G>
		| V.Clause.Import.As<G>
		| V.Clause.Import.Attribute<G>
		| V.Clause.Import.List<G>
		| V.Clause.Import.List.Scoped<G>
		| V.Clause.Import.Names<G>
		| V.Clause.Import.Namespace<G>
		| V.Clause.Import.Relative<G>
		| V.Clause.Import.Relative.Prefix<G>
		| V.Clause.Import.Require<G>
		| V.Clause.Import.Specifier<G>
		| V.Clause.Import.Wildcard<G>
		| V.Clause.Let<G>
		| V.Clause.Let.Chain<G>
		| V.Clause.Lifetimes<G>
		| V.Clause.Macro.Rule<G>
		| V.Clause.MappedType<G>
		| V.Clause.Match.Arm<G>
		| V.Clause.Match.Arm.Last<G>
		| V.Clause.Print.Chevron<G>
		| V.Clause.Where<G>
		| V.Clause.Where.Predicate<G>
		| V.Clause.With<G>
		| V.Clause.With.Item<G>;
}
