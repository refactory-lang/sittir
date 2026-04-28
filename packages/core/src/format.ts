import type { FormatRecord } from './types.ts';

/**
 * Apply a {@link FormatRecord} to a canonical render string.
 *
 * @param canonicalRender - The template-canonical rendered string.
 * @param format - The format record to apply.
 * @returns The reconstructed string with boundary, trivia, slots, and
 *   literals applied.
 *
 * @remarks
 * Steps:
 * 1. Apply `boundary.leading` (prepend) and `boundary.trailing` (append).
 * 2. Insert `trivia` items at their recorded byte offsets (applied
 *    right-to-left to preserve earlier offsets).
 * 3. `slots` and `literals` adjustments are reserved for future phases;
 *    if present they are noted but do not alter the output in Phase 1.
 */
export function applyFormat(
	canonicalRender: string,
	format: FormatRecord,
): string {
	let result = canonicalRender;

	result = applyBoundary(result, format);
	result = applyTrivia(result, format);

	return result;
}

/** Prepend/append boundary whitespace. */
function applyBoundary(s: string, format: FormatRecord): string {
	const { boundary } = format;
	if (!boundary) return s;
	const leading = boundary.leading ?? '';
	const trailing = boundary.trailing ?? '';
	return `${leading}${s}${trailing}`;
}

/**
 * Insert trivia items at their recorded byte offsets.
 * Items are applied in descending offset order so earlier offsets
 * are not invalidated.
 */
function applyTrivia(s: string, format: FormatRecord): string {
	const { trivia } = format;
	if (!trivia || trivia.length === 0) return s;

	const sorted = [...trivia].sort((a, b) => b.offset - a.offset);
	let result = s;
	for (const item of sorted) {
		const offset = Math.min(item.offset, result.length);
		result = result.slice(0, offset) + item.text + result.slice(offset);
	}
	return result;
}
