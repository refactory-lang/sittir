/**
 * Type-level pins: only an empty form of a kind that has an inner gap offers `inner`; every other
 * node's `$trivia` is `leading` and `trailing`.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import python from '../src/index.ts';
import type * as T from '../src/types.ts';
import { createEngine } from '@sittir/common';

const engine = await createEngine(python);

// @ts-expect-error a kind with no inner gap has no inner position
engine.build.identifier('a').$trivia.inner();

engine.build.identifier('a').$trivia.leading();

declare const parsedArgs: T.ArgumentList.Parsed;
// @ts-expect-error an edited node is never typed as an empty form, so it has no inner position
parsedArgs.$with.arguments().$trivia.inner();
parsedArgs.$with.arguments().$trivia.leading();
