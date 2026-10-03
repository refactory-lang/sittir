// Generated from the grammars' bindings.scm. Do not edit.
import type * as V from './index.ts';

/** The typemap: one key per top-level namespace, projecting to that namespace's kind-set for a grammar. */
export interface GrammarContext {
	readonly argument: unknown;
	readonly attribute: unknown;
	readonly clause: unknown;
	readonly comment: unknown;
	readonly declaration: unknown;
	readonly element: unknown;
	readonly expression: unknown;
	readonly identifier: unknown;
	readonly literal: unknown;
	readonly modifier: unknown;
	readonly module: unknown;
	readonly pattern: unknown;
	readonly statement: unknown;
	readonly type: unknown;
}

/** A grammar kind a member admits that no binding claims yet; the name says which. */
export interface Unmapped<K extends string> {
	readonly $unmapped: K;
}

/** The permissive closure: every namespace's full kind-set. */
export interface BaseContext extends GrammarContext {
	readonly argument: V.Argument.Any<BaseContext>;
	readonly attribute: V.Attribute.Any<BaseContext>;
	readonly clause: V.Clause.Any<BaseContext>;
	readonly comment: V.Comment.Any<BaseContext>;
	readonly declaration: V.Declaration.Any<BaseContext>;
	readonly element: V.Element.Any<BaseContext>;
	readonly expression: V.Expression.Any<BaseContext>;
	readonly identifier: V.Identifier.Any<BaseContext>;
	readonly literal: V.Literal.Any<BaseContext>;
	readonly modifier: V.Modifier.Any<BaseContext>;
	readonly module: V.Module.Any<BaseContext>;
	readonly pattern: V.Pattern.Any<BaseContext>;
	readonly statement: V.Statement.Any<BaseContext>;
	readonly type: V.Type.Any<BaseContext>;
}
