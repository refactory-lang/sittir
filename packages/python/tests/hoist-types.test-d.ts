/**
 * Type-level pins for the node-surface hoist: a holder's slot reads through
 * every single-slot wrapper it meets, and a wrapper's own slot reads through
 * the rest of its chain.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import type * as T from '../src/types.ts';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

export function chainOfTwoReadsAsItsElements(): void {
	expectTrue<Equals<ReturnType<T.FunctionDefinition['parameters']>, readonly T.Parameter[]>>();
	expectTrue<Equals<ReturnType<T.Parameters['elements']>, readonly T.Parameter[]>>();
}

export function singleWrapperReadsAsWhatItHolds(): void {
	expectTrue<Equals<Extract<ReturnType<T.TypedParameter['type']>, T.Type>, never>>();
	expectTrue<Equals<ReturnType<T.TryStatement['finalizer']>, T.Suite | undefined>>();
}

export function listOfWrappersReadsAsListOfWhatTheyHold(): void {
	expectTrue<Equals<ReturnType<T.DecoratedDefinition['decorators']>, readonly T.Expression[]>>();
	expectTrue<Equals<ReturnType<T.MatchStatement['body']>, readonly T.CaseClause[]>>();
}

export function holderThatAdmitsAnotherKindKeepsTheWrapper(): void {
	expectTrue<Equals<ReturnType<T.IfStatement['alternatives']>, readonly (T.ElifClause | T.ElseClause)[]>>();
}
