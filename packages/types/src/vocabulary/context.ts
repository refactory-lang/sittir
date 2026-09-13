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
	readonly argument: V.Argument.Kinds<BaseContext>;
	readonly attribute: V.Attribute.Kinds<BaseContext>;
	readonly clause: V.Clause.Kinds<BaseContext>;
	readonly comment: V.Comment.Kinds<BaseContext>;
	readonly declaration: V.Declaration.Kinds<BaseContext>;
	readonly element: V.Element.Kinds<BaseContext>;
	readonly expression: V.Expression.Kinds<BaseContext>;
	readonly identifier: V.Identifier.Kinds<BaseContext>;
	readonly literal: V.Literal.Kinds<BaseContext>;
	readonly modifier: V.Modifier.Kinds<BaseContext>;
	readonly module: V.Module.Kinds<BaseContext>;
	readonly pattern: V.Pattern.Kinds<BaseContext>;
	readonly statement: V.Statement.Kinds<BaseContext>;
	readonly type: V.Type.Kinds<BaseContext>;
}
