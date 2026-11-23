/**
 * Type-level pins: a row of a required choice of arms is one tuple per arm. Each
 * tuple needs the keys its arm requires and refuses the keys only another arm
 * holds; a key every arm holds is in each tuple; an arm that requires nothing
 * takes an absent config when the row leads with an optional one.
 *
 * Compile-time only: `pnpm --filter @sittir/types type-check`.
 */

import type { ArmRows } from '../src/index.ts';

interface Config {
	readonly value?: number;
	readonly arguments?: string;
	readonly shared?: boolean;
}
type Exclusive = ArmRows<[config: Config, options?: { readonly marker?: true }], 'value' | 'arguments' | 'shared', [['value' | 'shared', 'value'], ['arguments' | 'shared', 'arguments']]>;
declare const exclusive: (...args: Exclusive) => void;
type OptionalFirst = ArmRows<[config?: Config], 'value' | 'arguments', [['value', 'value'], ['arguments', never]]>;
declare const optionalFirst: (...args: OptionalFirst) => void;

export function eachArmAloneCompiles(): void {
	exclusive({ value: 1 });
	exclusive({ arguments: 'a' });
	exclusive({ value: 1, shared: true }, { marker: true });
	exclusive({ arguments: 'a', shared: false });
}

export function bothArmsAreAnError(): void {
	// @ts-expect-error the arms exclude each other
	exclusive({ value: 1, arguments: 'a' });
}

export function anEmptyConfigIsAnError(): void {
	// @ts-expect-error no arm is empty
	exclusive({});
	// @ts-expect-error a config is required
	exclusive();
	// @ts-expect-error the shared key alone names no arm
	exclusive({ shared: true });
}

export function anArmThatRequiresNothingTakesAnAbsentConfig(): void {
	optionalFirst();
	optionalFirst({});
	optionalFirst({ value: 1 });
	optionalFirst({ arguments: 'a' });
}

export function anArmThatRequiresNothingStillRefusesTheOtherArm(): void {
	// @ts-expect-error the arms exclude each other
	optionalFirst({ value: 1, arguments: 'a' });
}

export function aBuiltNodeAndATextAreInEveryTuple(node: { readonly $type: 1 }): void {
	type Loose = ArmRows<[config: Config | { readonly $type: 1 } | string], 'value' | 'arguments', [['value', 'value'], ['arguments', 'arguments']]>;
	const loose: (...args: Loose) => void = () => undefined;
	loose(node);
	loose('text');
}
