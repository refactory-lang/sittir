/**
 * Type-level pin: a kind's `LooseArgs` row is the argument list its public
 * builder takes. Every kind that has a row and an exported builder is
 * compared, so a row that drifts from its call is a compile error here.
 *
 * A kind built through sub-builders only has no call of its own and no row;
 * its sub-builders are kinds with rows and are compared like any other. The
 * second pin says no row-bearing kind is left out for want of a call.
 *
 * Compile-time only: `pnpm --filter @sittir/scm type-check`.
 */

import type { ArgsOf } from '@sittir/types';
import type * as F from '../src/factories/index.ts';
import type * as T from '../src/types.ts';

type Build = typeof F;
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
declare function expectTrue<X extends true>(): X;

type RowId = {
	[Id in keyof T.IrKeyOf & keyof T.NamespaceMap]: T.IrKeyOf[Id] extends keyof Build ? Id : never;
}[keyof T.IrKeyOf & keyof T.NamespaceMap];
type BuilderOf<Id extends RowId> = Build[T.IrKeyOf[Id] & keyof Build];
type CallableId = { [Id in RowId]: BuilderOf<Id> extends (...args: never[]) => unknown ? Id : never }[RowId];

type RowDiffersFromCall = {
	[Id in CallableId]: Equals<ArgsOf<BuilderOf<Id>>, T.NamespaceMap[Id]['LooseArgs']> extends true ? never : T.IrKeyOf[Id];
}[CallableId];
type RowWithoutCall = { [Id in Exclude<RowId, CallableId>]: T.IrKeyOf[Id] }[Exclude<RowId, CallableId>];

export function everyBuilderTakesItsRow(): void {
	expectTrue<Equals<RowDiffersFromCall, never>>();
}

export function everyRowHasACall(): void {
	expectTrue<Equals<RowWithoutCall, never>>();
}
