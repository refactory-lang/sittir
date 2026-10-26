/**
 * Type-level pin: a kind's `BuildArgs` row is the argument list of its
 * entry in the strict engine's builder table, at the top of the table and
 * at every sub-builder path. What is compared, and what counts as a
 * difference, is declared once in the shared support file.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import type { Expect, IsNever, RowDiffersFromCall, SubBuilderDiffersFromRow } from '../../types/tests/support/row-is-the-call.ts';
import type { ir } from '../src/ir-strict.ts';
import type * as T from '../src/types.ts';
import type { SubBuilderRowKind } from '../src/types-internal.ts';

export type EveryStrictEntryTakesItsRow = Expect<IsNever<RowDiffersFromCall<typeof ir, T.TypeKeyOf, T.NamespaceMap, 'BuildArgs'>>>;
export type EveryStrictSubBuilderTakesItsRow = Expect<
	IsNever<SubBuilderDiffersFromRow<typeof ir, SubBuilderRowKind, T.NamespaceMap, 'BuildArgs'>>
>;
