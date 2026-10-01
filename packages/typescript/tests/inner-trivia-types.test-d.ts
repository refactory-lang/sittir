/**
 * Type-level pins: only an empty form of a kind that has an inner gap offers `inner`; every other
 * node's `$trivia` is `leading` and `trailing`.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const engine = await createEngine(typescript);

// @ts-expect-error a kind with no inner gap has no inner position
engine.build.identifier('a').$trivia.inner();

engine.build.identifier('a').$trivia.leading();
