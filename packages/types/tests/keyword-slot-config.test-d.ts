/**
 * Type-level tests for keyword-presence slots (kind enum, bitflag, boolean
 * keyword) in `ConfigOf`: a required key rejects undefined, an optional key
 * accepts it.
 *
 * Run with: pnpm --filter @sittir/types type-check
 */

import type { BooleanKeyword, Bitflag, ConfigOf, KindEnum } from '../src/index.ts';

type Op = KindEnum<'+' | '-', 1 | 2>;
type Flags = Bitflag<'a' | 'b', 4>;
type Async = BooleanKeyword<'async'>;

interface Required3 {
	readonly $type: 1;
	readonly _op: Op;
	readonly _flags: Flags;
	readonly _async: Async;
}
type RequiredConfig = ConfigOf<Required3>;

export const requiredFull: RequiredConfig = { op: '+', flags: 'a', async: true };

// @ts-expect-error a required kind-enum key rejects undefined.
export const requiredOpUndefined: RequiredConfig = { op: undefined, flags: 'a', async: true };

// @ts-expect-error a required bitflag key rejects undefined.
export const requiredFlagsUndefined: RequiredConfig = { op: '+', flags: undefined, async: true };

// @ts-expect-error a required boolean-keyword key rejects undefined.
export const requiredAsyncUndefined: RequiredConfig = { op: '+', flags: 'a', async: undefined };

// @ts-expect-error a required kind-enum key cannot be omitted.
export const requiredOpOmitted: RequiredConfig = { flags: 'a', async: true };

interface Optional3 {
	readonly $type: 1;
	readonly _op?: Op;
	readonly _flags?: Flags;
	readonly _async?: Async;
}
type OptionalConfig = ConfigOf<Optional3>;

export const optionalOmitted: OptionalConfig = {};
export const optionalUndefined: OptionalConfig = { op: undefined, flags: undefined, async: undefined };
