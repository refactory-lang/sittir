export type * from './literal.ts';

import type { RawStrings } from '../index.ts';
import type { MultilineStrings } from '../../multiline-strings/index.ts';
import type { FormatStrings } from '../../string-interpolation/format-strings/index.ts';

/** Raw string forms: raw strings that are also multiline, bytes, interpolated or deferred. */
export interface RawStringForms extends RawStrings, MultilineStrings, FormatStrings {
	readonly 'raw-string-forms': true;
}
