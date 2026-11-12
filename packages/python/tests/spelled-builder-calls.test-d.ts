/**
 * Type-level pins for the calls a spelled builder takes: each call's result
 * types the spelling the builder builds, a callback typed to promise one
 * spelling is refused (its caller types both), and the argument lists of its
 * overloads are its `LooseArgs` row.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import type { ArgsOf } from '@sittir/types';
import type { SameArguments } from '../../types/tests/support/row-is-the-call.ts';
import { ir } from '../src/ir.ts';
import type * as T from '../src/types.ts';

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Spelled<P> = { readonly _radixPrefix: P };

declare const forwardedOptions: { readonly radixPrefix: '0x' } | undefined;
declare const typedOptions: T.IntegerHex.Options;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const anyOptions: any;

const omitted = ir.integer.hex('0XFF');
const bare = ir.integer.hex('FF');
const literal = ir.integer.hex('0XFF', { radixPrefix: '0x' });
const forwarded = ir.integer.hex('0XFF', forwardedOptions);
const explicitUndefined = ir.integer.hex('0XFF', undefined);
const inputOnly = ir.integer.hex<string>('FF', { radixPrefix: '0X' });
const bothTypesNoOptions = ir.integer.hex<string, T.IntegerHex.Options>('FF');
const typed = ir.integer.hex(255n, typedOptions);

type Instantiated = typeof ir.integer.hex<string, T.IntegerHex.Options>;
const spreadInstantiated = (...args: Parameters<Instantiated>) => ir.integer.hex(...args);

const anyWithTypes = ir.integer.hex<'0XFF', T.IntegerHex.Options>('0XFF', anyOptions);
const nodeWithAnyOptions = ir.integer.hex(omitted, anyOptions);
const instantiated = ir.integer.hex<string, T.IntegerHex.Options>;
const forwardInstantiatedArgs = (...args: ArgsOf<typeof instantiated>) => instantiated(...args);
function forwardGenericArgs<I extends T.IntegerHex.Loose>() {
	const generic = ir.integer.hex<I, T.IntegerHex.Options>;
	return (...args: ArgsOf<typeof generic>) => generic(...args);
}
const withoutOptions = ir.integer.hex<string, undefined>;
const forwardWithoutOptions = (...args: ArgsOf<typeof withoutOptions>) => withoutOptions(...args);
const withNeverOptions = ir.integer.hex<string, never>;
const forwardNeverOptions = (...args: ArgsOf<typeof withNeverOptions>) => withNeverOptions(...args);

function inferredForward<O extends T.IntegerHex.Options>(options?: O) {
	return ir.integer.hex('0XFF', options);
}
function explicitForward<O extends T.IntegerHex.Options>(options?: O) {
	return ir.integer.hex<'0XFF', O>('0XFF', options);
}

// @ts-expect-error a callback that may pass options cannot promise the omitted call's spelling
export const narrowCallback: (text: '0XFF', options?: T.IntegerHex.Options) => typeof omitted = ir.integer.hex;
// @ts-expect-error a callback typed to promise one spelling is refused even when it passes no options, so its caller types both
export const optionlessNarrowCallback: (text: '0XFF') => typeof omitted = ir.integer.hex;
export const wideCallback: (text: '0XFF', options?: T.IntegerHex.Options) => Spelled<'0x' | '0X'> = ir.integer.hex;

type Calls = ArgsOf<typeof ir.integer.hex>;
type InstantiatedCalls = ArgsOf<Instantiated>;

export type EachCallTypesTheSpellingItBuilds = [
	Same<typeof omitted._radixPrefix, '0X'>,
	Same<typeof bare._radixPrefix, '0x'>,
	Same<typeof literal._radixPrefix, '0x'>,
	Same<typeof forwarded._radixPrefix, '0x' | '0X'>,
	Same<typeof explicitUndefined._radixPrefix, '0X'>,
	Same<typeof inputOnly._radixPrefix, '0x' | '0X'>,
	Same<typeof bothTypesNoOptions._radixPrefix, '0x' | '0X'>,
	Same<typeof typed._radixPrefix, '0x' | '0X'>,
	Same<ReturnType<typeof spreadInstantiated>['_radixPrefix'], '0x' | '0X'>,
	Same<ReturnType<typeof inferredForward<T.IntegerHex.Options>>['_radixPrefix'], '0x' | '0X'>,
	Same<ReturnType<typeof explicitForward<T.IntegerHex.Options>>['_radixPrefix'], '0x' | '0X'>,
	Same<typeof anyWithTypes._radixPrefix, '0x' | '0X'>,
	Same<typeof nodeWithAnyOptions._radixPrefix, '0X'>,
	Same<ReturnType<typeof forwardInstantiatedArgs>['_radixPrefix'], '0x' | '0X'>,
	Same<ReturnType<ReturnType<typeof forwardGenericArgs<string>>>['_radixPrefix'], '0x' | '0X'>,
	Same<ReturnType<typeof forwardWithoutOptions>['_radixPrefix'], '0x' | '0X'>,
	Same<ReturnType<typeof forwardNeverOptions>['_radixPrefix'], '0x' | '0X'>
];
export const eachCall: EachCallTypesTheSpellingItBuilds = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];

export type TheOverloadsAreTheRow = [
	Same<Calls['length'], 1 | 2>,
	Same<InstantiatedCalls['length'], 1 | 2>,
	undefined extends Calls[1] ? true : false,
	SameArguments<Calls, T.IntegerHex.LooseArgs>
];
export const overloads: TheOverloadsAreTheRow = [true, true, true, true];
