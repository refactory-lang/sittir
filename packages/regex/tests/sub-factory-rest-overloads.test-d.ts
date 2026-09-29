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

rx.build.termGroup.characterClass.coerce({ content: [] });
// @ts-expect-error a number is not a character class atom
rx.build.termGroup.characterClass.coerce({ content: [42] });
