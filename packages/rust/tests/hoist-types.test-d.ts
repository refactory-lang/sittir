/**
 * Type-level pins for the node-surface hoist: a holder's slot reads through
 * every single-slot wrapper it meets, and a wrapper's own slot reads through
 * the rest of its chain.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import type * as T from '../src/types.ts';
import type { NonEmptyArray } from '@sittir/types';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

export function chainOfTwoReadsAsItsElements(): void {
	expectTrue<Equals<ReturnType<T.FunctionItem['typeParameters']>, readonly T.AttributedTypeParameter[]>>();
	expectTrue<Equals<ReturnType<T.TypeParameters['elements']>, NonEmptyArray<T.AttributedTypeParameter>>>();
	expectTrue<Equals<ReturnType<T.CallExpression['arguments']>, readonly T.Argument[]>>();
}

export function polymorphWrapperReadsAsItsForm(): void {
	expectTrue<Equals<Extract<ReturnType<T.FunctionItem['visibilityModifier']>, T.VisibilityModifier>, never>>();
}

export function externModifierReadsItsAbi(): void {
	expectTrue<Equals<ReturnType<T.ForeignModItemBody['externModifier']>, T.StringLiteral | undefined>>();
}

export function wrapperWithAReceiverFormKeepsTheForm(): void {
	expectTrue<Equals<ReturnType<T.FunctionItem['parameters']>, T.ParametersElements | T.ParametersElementsReceiver | undefined>>();
}

type ArgumentAttributeItems = NonNullable<T.Argument.Config>['attributeItems'];

export function aListOfWrapperSlotsAdmitsItsItemsAndTheirWrappersPerItem(): void {
	expectTrue<readonly T.Attribute.Bound[] extends ArgumentAttributeItems ? true : false>();
	expectTrue<readonly T.AttributeItem.Bound[] extends ArgumentAttributeItems ? true : false>();
	expectTrue<readonly (T.Attribute.Bound | T.AttributeItem.Bound)[] extends ArgumentAttributeItems ? true : false>();
	expectTrue<readonly T.Expression.Bound[] extends ArgumentAttributeItems ? false : true>();
}
