/**
 * Type-level pin: a coercer declared by its seat's signatures has the seat alias's type, so it accepts and refuses
 * exactly what the alias does. `global_statement`'s loose input is a union of 351 forms, too complex for TypeScript to
 * check a plain implementation against its seat; `for_statement_conditions_initializer` is a row call.
 *
 * Compile-time only: `pnpm --filter @sittir/csharp type-check`.
 */

import type { ConfigSeat, Seat } from '@sittir/types';
import type { Expect, Identical } from '../../types/tests/support/coercer-is-its-seat.ts';
import type { coerceToForStatementConditionsInitializer, coerceToGlobalStatement } from '../src/factories/coerce.ts';
import type * as T from '../src/types.ts';

type GlobalStatementSeat = ConfigSeat<T.GlobalStatement.Loose, ReturnType<typeof coerceToGlobalStatement>>;

export type GlobalStatementIsItsSeat = Expect<Identical<typeof coerceToGlobalStatement, GlobalStatementSeat>>;

export type ForStatementConditionsInitializerIsItsSeat = Expect<
	Identical<
		typeof coerceToForStatementConditionsInitializer,
		Seat<T.ForStatementConditionsInitializer.LooseArgs, ReturnType<typeof coerceToForStatementConditionsInitializer>>
	>
>;

export function acceptsAndRefusesAsItsSeat(
	coerce: typeof coerceToGlobalStatement,
	seat: GlobalStatementSeat,
	config: T.GlobalStatement.LooseConfig
): void {
	coerce(config);
	seat(config);
	// @ts-expect-error a key the config does not declare is refused
	coerce({ ...config, extra: 1 });
	// @ts-expect-error a key the config does not declare is refused
	seat({ ...config, extra: 1 });
}
