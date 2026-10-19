/**
 * Type-level pin: the root of a whole-source parse offers `$trivia.inner`, because a file with no
 * item holds its trivia on the root's inner side.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const engine = await createEngine(rust);

const root = engine.parse('// only a comment\n');

root.$trivia.inner();
root.$trivia.leading();
