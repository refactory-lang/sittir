/**
 * Type-level pin: an entry reached through a parent's sub-builder takes the
 * `LooseArgs` row of the kind it builds. The paths come from the generated
 * map; what counts as a difference is declared in the shared support file.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import type { Expect, IsNever, SubBuilderDiffersFromRow } from '../../types/tests/support/row-is-the-call.ts';
import type { ir } from '../src/ir.ts';
import type * as T from '../src/types.ts';
import type { SubBuilderRowKind } from '../src/types-internal.ts';

export type EverySubBuilderTakesItsRow = Expect<IsNever<SubBuilderDiffersFromRow<typeof ir, SubBuilderRowKind, T.NamespaceMap>>>;
