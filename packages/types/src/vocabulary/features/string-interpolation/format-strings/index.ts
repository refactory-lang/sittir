export type * from './expression.ts';
export type * from './literal.ts';

import type { StringInterpolation } from '../index.ts';
import type { MultilineStrings } from '../../multiline-strings/index.ts';

/** Format strings: conversions and format specifiers in interpolations, deferred and multiline interpolated strings. */
export interface FormatStrings extends StringInterpolation, MultilineStrings {
	readonly 'format-strings': true;
}
