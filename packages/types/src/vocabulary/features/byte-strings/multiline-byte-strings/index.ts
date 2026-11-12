export type * from './literal.ts';

import type { ByteStrings } from '../index.ts';
import type { MultilineStrings } from '../../multiline-strings/index.ts';

/** Multiline byte strings: a byte string that spans lines. */
export interface MultilineByteStrings extends ByteStrings, MultilineStrings {
	readonly 'multiline-byte-strings': true;
}
