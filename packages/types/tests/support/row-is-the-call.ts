/**
 * Shared declaration for each grammar's `loose-args-row-is-the-call` and
 * `strict-args-row-is-the-call` type tests: the kinds whose row is not the
 * argument list of their entry in one of the grammar's builder tables. The
 * `LooseArgs` row is compared with the default engine's `ir` entry, the
 * `BuildArgs` row with the strict engine's.
 *
 * Every kind with a row and an `ir` key is compared. An entry that is a
 * constant (a kind with no content to supply) takes no call; its row is the
 * empty list. Kinds with a row and no `ir` key of their own are not
 * compared by `RowDiffersFromCall`: `SubBuilderDiffersFromRow` compares the
 * ones reached through a parent's sub-builder, from the generated map of
 * `ir` path to the kind whose row declares that entry. A path the map
 * names that `ir` does not hold, or a kind it names that has no row, is a
 * difference.
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

export type Row = 'LooseArgs' | 'BuildArgs';

type RowOf<Namespace, Which extends Row> = Namespace extends { readonly [Name in Which]: infer Args } ? Args : never;

export type RowDiffersFromCall<Ir, TypeKeyOf, NamespaceMap, Which extends Row = 'LooseArgs'> = {
	[Id in keyof TypeKeyOf & keyof NamespaceMap]: TypeKeyOf[Id] extends keyof Ir
		? SameArguments<CallOf<EntryOf<Ir, TypeKeyOf[Id]>>, RowOf<NamespaceMap[Id], Which>> extends true
			? never
			: TypeKeyOf[Id]
		: never;
}[keyof TypeKeyOf & keyof NamespaceMap];

type At<Holder, Path extends string> = Path extends `${infer Head}.${infer Rest}`
	? Head extends keyof Holder
		? At<Holder[Head], Rest>
		: never
	: Path extends keyof Holder
		? Holder[Path]
		: never;

type CallAt<Ir, Path extends string> = [At<Ir, Path>] extends [never]
	? 'no entry'
	: CallOf<At<Ir, Path>>;

type RowFor<NamespaceMap, Kind, Which extends Row> = Kind extends keyof NamespaceMap ? RowOf<NamespaceMap[Kind], Which> : 'no row';

export type SubBuilderDiffersFromRow<Ir, RowKindByPath, NamespaceMap, Which extends Row = 'LooseArgs'> = {
	[Path in keyof RowKindByPath & string]: SameArguments<
		CallAt<Ir, Path>,
		RowFor<NamespaceMap, RowKindByPath[Path], Which>
	> extends true
		? never
		: Path;
}[keyof RowKindByPath & string];

type BoundOf<Namespace> = Namespace extends { readonly Bound: infer Bound } ? Bound : never;

/**
 * The kinds whose row accepts a single argument that is the kind's own built
 * node.
 */
export type TakesOwnNode<TypeKeyOf, NamespaceMap, Which extends Row> = {
	[Id in keyof TypeKeyOf & keyof NamespaceMap]: [BoundOf<NamespaceMap[Id]>] extends [never]
		? never
		: [BoundOf<NamespaceMap[Id]>] extends RowOf<NamespaceMap[Id], Which>
			? TypeKeyOf[Id]
			: never;
}[keyof TypeKeyOf & keyof NamespaceMap];

export type SameKinds<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
