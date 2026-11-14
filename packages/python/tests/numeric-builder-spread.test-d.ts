/**
 * Type-level pin: a numeric builder's uninstantiated `Parameters` spread into
 * the builder compiles, for every builder of an integer or a float, and a
 * config with an undeclared key is still refused.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import { ir } from '../src/ir.ts';

export const forwardHex = (...args: Parameters<typeof ir.integer.hex>) => ir.integer.hex(...args);
export const forwardOctal = (...args: Parameters<typeof ir.integer.octal>) => ir.integer.octal(...args);
export const forwardBinary = (...args: Parameters<typeof ir.integer.binary>) => ir.integer.binary(...args);
export const forwardLegacyOctal = (...args: Parameters<typeof ir.integer.legacyOctal>) => ir.integer.legacyOctal(...args);
export const forwardDecimal = (...args: Parameters<typeof ir.integer.decimal>) => ir.integer.decimal(...args);
export const forwardPoint = (...args: Parameters<typeof ir.float.point>) => ir.float.point(...args);
export const forwardLeadingPoint = (...args: Parameters<typeof ir.float.leadingPoint>) => ir.float.leadingPoint(...args);
export const forwardScientific = (...args: Parameters<typeof ir.float.scientific>) => ir.float.scientific(...args);

export function refusals(): void {
	ir.integer.hex('ff');
	// @ts-expect-error a config key the builder does not declare is refused
	ir.integer.hex({ content: 'ff', undeclared: 1 });
}
