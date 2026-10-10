/**
 * Type-level pin: which strict rows accept the kind's own built node. A
 * strict builder does not take its own node as a copy or a pass-through; the
 * only kinds whose `BuildArgs` admit it are the ones whose one slot can hold
 * the kind itself, where the node is that slot's value and the call wraps
 * it. This grammar has no such kind.
 *
 * Compile-time only: `pnpm --filter @sittir/regex type-check`.
 */

import type { Expect, IsNever, TakesOwnNode } from '../../types/tests/support/row-is-the-call.ts';
import type * as T from '../src/types.ts';

export type NoStrictRowTakesItsOwnNode = Expect<IsNever<TakesOwnNode<T.TypeKeyOf, T.NamespaceMap, 'BuildArgs'>>>;
