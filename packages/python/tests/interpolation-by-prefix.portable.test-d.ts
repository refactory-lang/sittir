/**
 * Type-level pins: a portable string path decides its prefix, so it decides whether its `elements` hold interpolations. The
 * `literal.string.interpolated` paths hold them, and every other `literal.string` path holds text only. An escape reads its
 * `content` and a concatenation its `strings`, so neither reads `elements`.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import type * as V from '../../types/src/vocabulary/index.ts';
import type { PythonMap } from '../src/portable/map.ts';

type Path = keyof V.Paths<PythonMap>;
type At<P extends Path> = V.Read<PythonMap, P>;
type In<P extends Path> = V.InputOf<V.Paths<PythonMap>[P], PythonMap>;
type ElementAt<P extends Path> = At<P> extends { readonly elements?: infer L } ? (NonNullable<L> extends readonly (infer E)[] ? E : never) : never;

declare const interpolation: At<'expression.interpolation'>;
declare const text: At<'literal.string.text'>;

export const formatted: In<'literal.string.interpolated'> = { $path: 'literal.string.interpolated', elements: [text, interpolation] };
export const deferred: In<'literal.string.interpolated.deferred.raw'> = { $path: 'literal.string.interpolated.deferred.raw', elements: [interpolation] };
export const plain: In<'literal.string'> = { $path: 'literal.string', elements: [text] };
// @ts-expect-error a string with no prefix holds no interpolation
export const plainInterpolated: In<'literal.string'> = { $path: 'literal.string', elements: [interpolation] };
// @ts-expect-error a bytes string holds no interpolation
export const bytesInterpolated: In<'literal.string.bytes'> = { $path: 'literal.string.bytes', elements: [text, interpolation] };
// @ts-expect-error a raw string holds no interpolation
export const rawInterpolated: In<'literal.string.raw.multiline'> = { $path: 'literal.string.raw.multiline', elements: [interpolation] };

export const readFormatted: ElementAt<'literal.string.interpolated.multiline'> = interpolation;
export const readUnicodeText: ElementAt<'literal.string.unicode'> = text;
// @ts-expect-error an escape reads its content, not elements
export const readEscapeText: ElementAt<'literal.string.escape'> = text;
// @ts-expect-error a concatenation reads its strings, not elements
export const readConcatenatedText: ElementAt<'literal.string.concatenated'> = text;
// @ts-expect-error a unicode string reads no interpolation
export const readUnicode: ElementAt<'literal.string.unicode'> = interpolation;
// @ts-expect-error an escape reads no elements
export const readEscape: ElementAt<'literal.string.escape'> = interpolation;
// @ts-expect-error a concatenation reads no elements; its interpolations are in its `strings`
export const readConcatenated: ElementAt<'literal.string.concatenated'> = interpolation;
