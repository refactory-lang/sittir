/**
 * Type-level pins: a loose builder whose children include keyword tokens
 * admits the keyword's text, in the spread form and the array form.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

export function keywordTextAdmitted(): string[] {
	return [py.build.unionPattern('True', '_').$render(), py.build.unionPattern(['None', 'False']).$render()];
}
