/**
 * Type-level pin: a sub-factory forwarding to a coercer whose overloads mix an
 * empty form with a `readonly` rest form takes the rest form's own elements,
 * not `unknown`.
 *
 * Compile-time only: `pnpm --filter @sittir/regex type-check`.
 */

import regex from '@sittir/regex';
import { createEngine } from '@sittir/common';

const rx = await createEngine(regex);

rx.build.pattern.alternation.coerce();
// @ts-expect-error a number is not an alternation term
rx.build.pattern.alternation.coerce(42);
