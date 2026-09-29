/**
 * Type-level pins for the integer decimal supertype nested under integer's
 * decimal arm: every call HEAD accepted still type-checks, and the nested
 * arms are reachable under each mount path.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import { ir } from '@sittir/python';

// The calls HEAD accepted.
ir.integer('3');
ir.integer(3);
ir.integer(3n);
ir.integer.hex(255);
ir.integer.decimal('3');
ir.primaryExpression.integer('3');

// The nested arms, with plain the default.
ir.integer.decimal.plain('3');
ir.integer.decimal.long('3L');
ir.integer.decimal.imaginary('3j');
ir.integerDecimal('3');
ir.primaryExpression.integer.decimal.long('3L');
