import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Method<G extends GrammarContext> extends SubKindOf<V.Declaration<G>> {
		readonly $kind: 'declaration.method';
		readonly accessor?: G['slots']['declaration.method']['accessor'];
		readonly body?: G['slots']['declaration.method']['body'];
		readonly const?: boolean;
		readonly decorators?: V.Attribute.Decorator<G>[];
		readonly default?: boolean;
		readonly doc?: V.Literal.String<G>;
		readonly extern?: V.Modifier.Extern<G>;
		readonly name: G['slots']['declaration.method']['name'];
		readonly optional?: boolean;
		readonly override?: boolean;
		readonly parameters: G['slots']['declaration.method']['parameters'][];
		readonly readonly?: boolean;
		readonly static?: boolean;
		readonly unsafe?: boolean;
		readonly visibility?: G['slots']['declaration.method']['visibility'];
		readonly whereClause?: V.Clause.Where<G>;
	}
	export namespace Method {
		export interface Class<G extends GrammarContext> extends SubKindOf<V.Declaration.Method<G>> {
			readonly $kind: 'declaration.method.class';
		}
		export interface Dunder<G extends GrammarContext> extends SubKindOf<V.Declaration.Method<G>> {
			readonly $kind: 'declaration.method.dunder';
			readonly name: `__${string}__`;
			readonly stem: string;
		}
		export interface Getter<G extends GrammarContext> extends SubKindOf<V.Declaration.Method<G>> {
			readonly $kind: 'declaration.method.getter';
			readonly accessor: 'get';
		}
		export interface Setter<G extends GrammarContext> extends SubKindOf<V.Declaration.Method<G>> {
			readonly $kind: 'declaration.method.setter';
			readonly accessor: 'set';
		}
		export interface Signature<G extends GrammarContext> extends SubKindOf<V.Declaration.Method<G>> {
			readonly $kind: 'declaration.method.signature';
			readonly accessor?: G['slots']['declaration.method.signature']['accessor'];
			readonly functionModifiers?: G['slots']['declaration.method.signature']['functionModifiers'][];
			readonly name: G['slots']['declaration.method.signature']['name'];
			readonly optional?: boolean;
			readonly override?: boolean;
			readonly parameters: G['slots']['declaration.method.signature']['parameters'][];
			readonly readonly?: boolean;
			readonly static?: boolean;
			readonly visibility?: G['slots']['declaration.method.signature']['visibility'];
			readonly whereClause?: V.Clause.Where<G>;
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarContext> extends SubKindOf<V.Declaration.Method.Signature<G>> {
				readonly $kind: 'declaration.method.signature.abstract';
				readonly abstract?: boolean;
				readonly accessorKind?: G['slots']['declaration.method.signature.abstract']['accessorKind'];
				readonly name: G['slots']['declaration.method.signature.abstract']['name'];
				readonly optional?: boolean;
				readonly override?: boolean;
				readonly parameters: V.Declaration.Parameter.Any<G>[];
				readonly visibility?: G['slots']['declaration.method.signature.abstract']['visibility'];
			}
		}
		export interface Static<G extends GrammarContext> extends SubKindOf<V.Declaration.Method<G>> {
			readonly $kind: 'declaration.method.static';
			readonly body: V.Statement.Block<G>;
			readonly const?: boolean;
			readonly default?: boolean;
			readonly extern?: V.Modifier.Extern<G>;
			readonly name: G['identifier'];
			readonly parameters: G['slots']['declaration.method.static']['parameters'][];
			readonly unsafe?: boolean;
			readonly visibility?: V.Modifier.Visibility<G>;
			readonly whereClause?: V.Clause.Where<G>;
		}
	}
}
