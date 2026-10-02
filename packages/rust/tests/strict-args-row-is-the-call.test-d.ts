/**
 * Type-level pin: a kind's `BuildArgs` row is the argument list of its
 * strict entry in the public `ir` namespace (the entry's `strict` member,
 * or the entry itself for a kind with one surface), at the top of `ir` and
 * at every sub-builder path. What is compared, and what counts as a
 * difference, is declared once in the shared support file.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import type { Expect, IsNever, RowDiffersFromCall, SubBuilderDiffersFromRow } from '../../types/tests/support/row-is-the-call.ts';
import type { ir } from '../src/ir.ts';
import type * as T from '../src/types.ts';
import type { SubBuilderRowKind } from '../src/types-internal.ts';

export type EveryStrictEntryTakesItsRow = Expect<IsNever<RowDiffersFromCall<typeof ir, T.IrKeyOf, T.NamespaceMap, 'BuildArgs'>>>;
export type EveryStrictSubBuilderTakesItsRow = Expect<
	IsNever<SubBuilderDiffersFromRow<typeof ir, SubBuilderRowKind, T.NamespaceMap, 'BuildArgs'>>
>;
