/**
 * Type-level pins: an attribute's input is a value after `=`, or its delimited
 * arguments. The arms exclude each other and an empty config is refused.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import type * as T from '../src/types.ts';

declare const value: NonNullable<T.AttributeInput.LooseConfig['value']>;
declare const args: NonNullable<T.AttributeInput.LooseConfig['arguments']>;

export function eachArmAloneCompiles(): void {
	const withValue: T.AttributeInput.LooseArgs = [{ value }];
	const withArguments: T.AttributeInput.LooseArgs = [{ arguments: args }];
	void withValue;
	void withArguments;
}

export function bothArmsAreAnError(): void {
	// @ts-expect-error the value and the arguments exclude each other
	const both: T.AttributeInput.LooseArgs = [{ value, arguments: args }];
	void both;
}

export function anEmptyConfigIsAnError(): void {
	// @ts-expect-error an attribute input is one of its arms
	const empty: T.AttributeInput.LooseArgs = [{}];
	// @ts-expect-error an attribute input is one of its arms
	const none: T.AttributeInput.LooseArgs = [];
	void empty;
	void none;
}
