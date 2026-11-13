/**
 * Type-level pins: a string's prefix decides whether its contents admit interpolations. An interpolating prefix (`f`, `t`, `rf`,
 * `rt`, in any spelling on the loose surface) admits them; any other prefix, or none, admits text only. The loose prefix is one of
 * the prefix's spellings, never any string.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import python from '../src/index.ts';
import { createEngine } from '@sittir/common';
import type * as T from '../src/types.ts';

const strict = await createEngine(python, { api: 'strict' });
const loose = await createEngine(python);

export function strictPrefixDecidesInterpolation(interpolation: T.Interpolation.Bound, text: T.StringContent.Bound): void {
	strict.build.string({ prefix: 'f', contents: [text, interpolation] });
	strict.build.string({ prefix: 'rt', contents: [interpolation] });
	strict.build.string({ prefix: 'b', contents: [text] });
	strict.build.string({ contents: [text] });
	// @ts-expect-error a bytes string admits no interpolation
	strict.build.string({ prefix: 'b', contents: [text, interpolation] });
	// @ts-expect-error a string with no prefix admits no interpolation
	strict.build.string({ contents: [interpolation] });
	// @ts-expect-error the strict prefix is a canonical member
	strict.build.string({ prefix: 'F', contents: [interpolation] });
}

export function loosePrefixIsASpelling(interpolation: T.Interpolation.Bound, text: T.StringContent.Bound, held: string): void {
	loose.build.string({ prefix: 'F', contents: [text, interpolation] });
	loose.build.string({ prefix: 'Rt', contents: [interpolation] });
	loose.build.string({ prefix: 'Rb', contents: [text] });
	// @ts-expect-error a raw bytes string admits no interpolation
	loose.build.string({ prefix: 'Rb', contents: [interpolation] });
	// @ts-expect-error a prefix held in a plain string is not one of the spellings
	loose.build.string({ prefix: held });
	// @ts-expect-error no prefix is spelled `q`
	loose.build.string({ prefix: 'q' });
}
