// The contexts shape, kinds only: every requirement, provider and bound is a kind or a (kind, slot),
// with no conditions. A distinction without a kind of its own is not expressed: no async function
// kind exists yet, so every function body provides Await. Context names are vocabulary terms.
// `Unproven` marks needs the types do not track (parsed and loose-built input).
import type * as T from '../../../../packages/typescript/src/types.ts';
import type { Admit } from '../../../../packages/types/src/node-surface.ts';

type Context = 'Break' | 'Continue' | 'Return' | 'Await' | 'Yield' | 'NewTarget' | 'Unproven';
declare const ContextSet: unique symbol;
export type Needs<N extends Context> = number & { readonly [ContextSet]?: N };
type With<B, N extends Context> = B & { readonly $needs: Needs<N> };
export type NeedsOf<X> = X extends { readonly $needs: Needs<infer N> } ? N : never;
type Bounded<B, A extends Context> = [Exclude<NeedsOf<B>, A | 'Unproven'>] extends [never] ? unknown : { readonly $needs: Needs<A | 'Unproven'> };

// What each bounding body provides; everything else is refused there.
type FunctionBody = 'Return' | 'Await' | 'NewTarget';
type GeneratorBody = FunctionBody | 'Yield';

export declare function block<C extends Admit<T.Statement>[]>(...c: C): With<T.StatementBlock.Bound, NeedsOf<C[number]>>;
export declare function whileS<P extends Admit<T.ParenthesizedExpression>, B extends Admit<T.Statement>>(c: { condition: P; body: B }): With<T.WhileStatement.Bound, NeedsOf<P> | Exclude<NeedsOf<B>, 'Break' | 'Continue'>>;
export declare function labeled<B extends Admit<T.Statement>>(c: { label: string; body: B }): With<T.LabeledStatement.Bound, Exclude<NeedsOf<B>, 'Break'>>;
export declare function ifS<P extends Admit<T.ParenthesizedExpression>, B extends Admit<T.Statement>>(c: { condition: P; consequence: B }): With<T.IfStatement.Bound, NeedsOf<P> | NeedsOf<B>>;
export declare function exprS<E extends Admit<T.Expression>>(e: E): With<T.ExpressionStatement.Bound, NeedsOf<E>>;
export declare function paren<E extends Admit<T.Expression>>(e: E): With<T.ParenthesizedExpression.Bound, NeedsOf<E>>;
export declare function awaitE<E extends Admit<T.Expression>>(e: E): With<T.AwaitExpression.Bound, 'Await' | NeedsOf<E>>;
export declare function yieldE<E extends Admit<T.Expression>>(e: E): With<T.YieldExpression.Bound, 'Yield' | NeedsOf<E>>;
export declare function newTarget(): With<T.MetaPropertyNewTarget.Bound, 'NewTarget'>;
export declare function bin<L extends Admit<T.Expression>, R extends Admit<T.Expression>>(l: L, r: R): With<T.BinaryExpression.Bound, NeedsOf<L> | NeedsOf<R>>;
export declare function call<F extends Admit<T.Expression>, A extends Admit<T.Expression>[]>(f: F, ...args: A): With<T.CallExpression.Bound, NeedsOf<F> | NeedsOf<A[number]>>;
export declare function ident(name: string): With<T.Identifier.Bound, never>;
export declare function breakS(): With<T.BreakStatement.Bound, 'Break'>;
export declare function continueS(): With<T.ContinueStatement.Bound, 'Continue'>;
export declare function returnS<E extends Admit<T.Expression> = never>(e?: E): With<T.ReturnStatement.Bound, 'Return' | NeedsOf<E>>;
export declare function fn<B extends Admit<T.StatementBlock>>(c: { name: string; body: B & Bounded<B, FunctionBody> }): With<T.FunctionDeclaration.Bound, never>;
export declare function genFn<B extends Admit<T.StatementBlock>>(c: { name: string; body: B & Bounded<B, GeneratorBody> }): With<T.GeneratorFunctionDeclaration.Bound, never>;
export declare function program<C extends Admit<T.Statement>[]>(...c: C & { [I in keyof C]: Bounded<C[I], 'Await'> }): With<T.Program.Bound, never>;
