/**
 * Type-level pins for the node-surface hoist: a holder's slot reads through
 * every single-slot wrapper it meets, and a wrapper's own slot reads through
 * the rest of its chain.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import type * as T from '../src/types.ts';
import type { NonEmptyArray } from '@sittir/types';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

export function chainOfTwoReadsAsItsElements(): void {
	expectTrue<Equals<ReturnType<T.ClassDeclaration['typeParameters']>, readonly T.TypeParameter[]>>();
	expectTrue<Equals<ReturnType<T.TypeParameters['elements']>, NonEmptyArray<T.TypeParameter>>>();
}

export function singleWrapperReadsAsWhatItHolds(): void {
	expectTrue<Equals<Extract<ReturnType<T.RequiredParameter['type']>, T.TypeAnnotation>, never>>();
	expectTrue<Equals<ReturnType<T.TryStatement['finalizer']>, T.StatementBlock | undefined>>();
}

export function polymorphWrapperReadsAsItsForm(): void {
	expectTrue<Equals<ReturnType<T.ClassDeclaration['heritage']>, T.ClassHeritageExtendsClause | T.ImplementsClause | undefined>>();
}

export function templateStringReadsItsParts(): void {
	expectTrue<
		Equals<ReturnType<T.CallExpressionTemplateCall['arguments']>, readonly (T.TemplateChars | T.EscapeSequence | T.TemplateSubstitution)[]>
	>();
}
