/**
 * Type-level pins for the integer decimal supertype nested under integer's
 * decimal arm: every call HEAD accepted still type-checks, and the nested
 * arms are reachable under each mount path.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import python from '@sittir/python';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

// The calls HEAD accepted.
py.build.integer('3');
py.build.integer(3);
py.build.integer(3n);
py.build.integer.hex(255);
py.build.integer.decimal('3');
py.build.primaryExpression.integer('3');

// The nested arms, with plain the default.
py.build.integer.decimal.plain('3');
py.build.integer.decimal.long('3L');
py.build.integer.decimal.imaginary('3j');
py.build.integerDecimal('3');
py.build.primaryExpression.integer.decimal.long('3L');
