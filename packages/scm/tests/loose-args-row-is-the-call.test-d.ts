/**
 * Type-level pin: a kind's `LooseArgs` row is the argument list of its entry
 * in the public `ir` namespace. What is compared, and what is not, is
 * declared once in the shared support file.
 *
 * Compile-time only: `pnpm --filter @sittir/scm type-check`.
 */

import type { Expect, IsNever, RowDiffersFromCall } from '../../types/tests/support/row-is-the-call.ts';
import type { ir } from '../src/ir.ts';
import type * as T from '../src/types.ts';

export type EveryEntryTakesItsRow = Expect<IsNever<RowDiffersFromCall<typeof ir, T.IrKeyOf, T.NamespaceMap>>>;
