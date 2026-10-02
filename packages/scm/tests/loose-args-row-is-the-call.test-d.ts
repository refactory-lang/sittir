/**
 * Type-level pin: a kind's `LooseArgs` row is the argument list of its entry
 * in the public `ir` namespace. Every kind with a row and an `ir` key is
 * compared, so a row that drifts from its call is a compile error here.
 *
 * An entry that is a constant (a kind with no content to supply) takes no
 * call; its row is the empty list.
 *
 * Kinds with a row and no `ir` key of their own are not compared: they are
 * reached through a parent's sub-builder or have no public call.
 *
 * Compile-time only: `pnpm --filter @sittir/scm type-check`.
 */

import type { ArgsOf } from '@sittir/types';
import type { ir } from '../src/ir.ts';
import type * as T from '../src/types.ts';

type Build = typeof ir;
type Call = (...args: never[]) => unknown;
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
declare function expectTrue<X extends true>(): X;

type RowId = keyof T.IrKeyOf & keyof T.NamespaceMap;
type PublicId = { [Id in RowId]: T.IrKeyOf[Id] extends keyof Build ? Id : never }[RowId];
type EntryOf<Id extends PublicId> = Build[T.IrKeyOf[Id] & keyof Build];
type CallOf<Id extends PublicId> = EntryOf<Id> extends Call ? ArgsOf<EntryOf<Id>> : [];

type RowDiffersFromCall = {
	[Id in PublicId]: Equals<CallOf<Id>, T.NamespaceMap[Id]['LooseArgs']> extends true ? never : T.IrKeyOf[Id];
}[PublicId];

export function everyEntryTakesItsRow(): void {
	expectTrue<Equals<RowDiffersFromCall, never>>();
}
