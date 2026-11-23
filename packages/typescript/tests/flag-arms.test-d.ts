/**
 * Type-level pin: a kind whose arms differ only in flags stays one config.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import type * as T from '../src/types.ts';

export function aKindWhoseArmsDifferOnlyInFlagsStaysOneConfig(): void {
	const flags: T.PublicFieldDefinitionPlain.LooseArgs = [{ name: 'x', static: true, abstract: true, readonly: true }];
	void flags;
}
