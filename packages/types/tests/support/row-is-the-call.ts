/**
 * Shared declaration for each grammar's `loose-args-row-is-the-call` type
 * test: the kinds whose `LooseArgs` row is not the argument list of their
 * entry in the grammar's public `ir` namespace.
 *
 * Every kind with a row and an `ir` key is compared. An entry that is a
 * constant (a kind with no content to supply) takes no call; its row is the
 * empty list. Kinds with a row and no `ir` key of their own are not
 * compared: they are reached through a parent's sub-builder or have no
 * public call.
 *
 * The comparison is mutual assignability, with `any` refused first: an
 * entry or a row that is `any`, or that has an `any` parameter, is a
 * difference. The invariant comparison is not used because an entry's
 * overloads read as a union of argument lists (`[] | [input?: X]`) that
 * is the same call as the row's one list (`[input?: X]`) without being the
 * same spelling.
 */

import type { ArgsOf } from '../../src/index.ts';

type Call = (...args: never[]) => unknown;

type IsAny<A> = 0 extends 1 & A ? true : false;

type HasAny<Args> = IsAny<Args> extends true
	? true
	: Args extends readonly unknown[]
		? true extends { [Index in keyof Args]: IsAny<Args[Index]> }[number]
			? true
			: false
		: false;

export type SameArguments<A, B> = HasAny<A> extends true
	? false
	: HasAny<B> extends true
		? false
		: [A] extends [B]
			? [B] extends [A]
				? true
				: false
			: false;

export type Expect<Holds extends true> = Holds;

export type IsNever<A> = [A] extends [never] ? true : false;

type EntryOf<Ir, Key> = Key extends keyof Ir ? Ir[Key] : never;

type CallOf<Entry> = IsAny<Entry> extends true ? Entry : Entry extends Call ? ArgsOf<Entry> : [];

type RowOf<Namespace> = Namespace extends { readonly LooseArgs: infer Row } ? Row : never;

export type RowDiffersFromCall<Ir, IrKeyOf, NamespaceMap> = {
	[Id in keyof IrKeyOf & keyof NamespaceMap]: IrKeyOf[Id] extends keyof Ir
		? SameArguments<CallOf<EntryOf<Ir, IrKeyOf[Id]>>, RowOf<NamespaceMap[Id]>> extends true
			? never
			: IrKeyOf[Id]
		: never;
}[keyof IrKeyOf & keyof NamespaceMap];
