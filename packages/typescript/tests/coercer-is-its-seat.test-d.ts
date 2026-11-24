/**
 * Type-level pin: a coercer declared by its seat's signatures has the seat alias's type, so it accepts and refuses
 * exactly what the alias does, for each of the three seats: a config (`else_clause`), a config that may be left out
 * (`yield_expression`) and a row call (`switch_default`, the largest loose input among this grammar's coercers).
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import type { ConfigSeat, OptionalConfigSeat, Seat } from '@sittir/types';
import type { Expect, Identical } from '../../types/tests/support/coercer-is-its-seat.ts';
import type { coerceToElseClause, coerceToSwitchDefault, coerceToYieldExpression } from '../src/factories/coerce.ts';
import type * as T from '../src/types.ts';

type ElseClauseSeat = ConfigSeat<T.ElseClause.Loose, ReturnType<typeof coerceToElseClause>>;

export type ElseClauseIsItsSeat = Expect<Identical<typeof coerceToElseClause, ElseClauseSeat>>;

export type YieldExpressionIsItsSeat = Expect<
	Identical<typeof coerceToYieldExpression, OptionalConfigSeat<T.YieldExpression.Loose, ReturnType<typeof coerceToYieldExpression>>>
>;

export type SwitchDefaultIsItsSeat = Expect<
	Identical<typeof coerceToSwitchDefault, Seat<T.SwitchDefault.LooseArgs, ReturnType<typeof coerceToSwitchDefault>>>
>;

export function acceptsAndRefusesAsItsSeat(coerce: typeof coerceToElseClause, seat: ElseClauseSeat, config: T.ElseClause.LooseConfig): void {
	coerce(config);
	seat(config);
	// @ts-expect-error a key the config does not declare is refused
	coerce({ ...config, extra: 1 });
	// @ts-expect-error a key the config does not declare is refused
	seat({ ...config, extra: 1 });
}
