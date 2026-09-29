/**
 * Type-level pin: a sub-factory forwarding to a coercer whose overloads mix an
 * empty form with a `readonly` rest form takes the rest form's own elements,
 * not `unknown`.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import python from '@sittir/python';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

py.build.matchBlock.block.coerce();
// @ts-expect-error a number is not a case clause
py.build.matchBlock.block.coerce(42);
