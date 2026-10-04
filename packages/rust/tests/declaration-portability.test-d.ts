/**
 * Type-level pins for declaration emit: a value typed by a slot setter, by a
 * builder's parameter and by `engine.render` is exported without an
 * annotation, so the program's declaration emit must name every type its
 * hover shows (TS2883 otherwise).
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

export const setter = rs.build.block().$with.statements;
export const builder = rs.build.functionItem.strict;
export const render = rs.render;
