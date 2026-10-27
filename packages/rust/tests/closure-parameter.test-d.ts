/**
 * Type-level pin: a closure parameter's strict input admits a bound list
 * pattern (a tuple or a slice), whose bound form is array-shaped, as the
 * node it is.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import type * as T from '../src/types.ts';
import type { buildClosureParameters } from '../src/factories/raw.ts';

declare const tuple: T.TuplePattern.Bound;
declare const slice: T.SlicePattern.Bound;
declare const build: typeof buildClosureParameters;

export const tupleBuilt = build(tuple);
export const sliceBuilt = build(slice);
export const rows: readonly T.ClosureParameters.BuildArgs[] = [[tuple], [slice]];
