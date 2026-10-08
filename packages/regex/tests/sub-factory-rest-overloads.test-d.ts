/**
 * Type-level pin: a sub-factory forwarding to a coercer whose overloads mix an
 * readonly array form with a rest form takes the rest form's own elements
 * and preserves its non-empty cardinality.
 *
 * Compile-time only: `pnpm --filter @sittir/regex type-check`.
 */

import regex from '@sittir/regex';
import type { Term } from '@sittir/regex';
import { createEngine } from '@sittir/common';

const rx = await createEngine(regex);

declare const term: Term.Bound;
rx.build.pattern.alternation.coerce(term);
// @ts-expect-error an alternation requires at least one term
rx.build.pattern.alternation.coerce();
// @ts-expect-error a number is not an alternation term
rx.build.pattern.alternation.coerce(42);
