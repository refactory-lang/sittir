/**
 * Controls for the shared row comparison in `support/row-is-the-call.ts`:
 * the cases it must report as a difference, and the one spelling
 * difference it must not.
 *
 * Compile-time only: `pnpm --filter @sittir/types type-check`.
 */

import type { Expect, IsNever, RowDiffersFromCall, SameArguments } from './support/row-is-the-call.ts';

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

interface KeyOf {
	1: 'leaf';
	2: 'list';
	3: 'constant';
}
interface Rows {
	1: { readonly LooseArgs: [text: string]; readonly BuildArgs: [text: number] };
	2: { readonly LooseArgs: [input?: string]; readonly BuildArgs: [input?: string] };
	3: { readonly LooseArgs: []; readonly BuildArgs: [] };
}
interface Entries {
	readonly leaf: (text: string) => unknown;
	readonly list: { (): unknown; (input?: string): unknown };
	readonly constant: 3;
}

export type AgreeingEntriesPass = Expect<IsNever<RowDiffersFromCall<Entries, KeyOf, Rows>>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEntries = { readonly [Key in keyof Entries]: any };
export type AnAnyEntryDiffers = Expect<Same<RowDiffersFromCall<AnyEntries, KeyOf, Rows>, 'leaf' | 'list' | 'constant'>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnAnyParameterDiffers = Expect<Same<SameArguments<[x: any], [x: string]>, false>>;

type StrictRows = { readonly [Id in keyof Rows]: { readonly LooseArgs: Rows[Id]['BuildArgs'] } };
export type AWrongRowDiffers = Expect<Same<RowDiffersFromCall<Entries, KeyOf, StrictRows>, 'leaf'>>;
