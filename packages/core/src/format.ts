import type { FormatRecord, FormatTrivia } from './types.ts';

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
 * 1. Insert `trivia` items at their recorded byte offsets (applied
 *    right-to-left to preserve earlier offsets). Offsets are
 *    canonical-relative, so trivia must be applied before boundary.
 * 2. Prepend `boundary.leading` and append `boundary.trailing`.
 * 3. `slots` and `literals` adjustments are reserved for future phases;
 *    if present they are noted but do not alter the output in Phase 1.
 */
export function applyFormat(canonicalRender: string, format: FormatRecord): string {
	let result = canonicalRender;

	result = applyTrivia(result, format);
	result = applyBoundary(result, format);

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
		const offset = Math.max(0, Math.min(item.offset, result.length));
		result = result.slice(0, offset) + item.text + result.slice(offset);
	}
	return result;
}

/**
 * Shift all {@link FormatTrivia} offsets that fall at or above `editStart`
 * by `delta` bytes, returning a shallow-cloned {@link FormatRecord}.
 *
 * Offsets below `editStart` are left unchanged. Sub-records in
 * `kinds` are rebased recursively with the same parameters.
 *
 * @param format - The source format record to rebase.
 * @param editStart - Absolute byte position of the edit boundary.
 * @param delta - Signed byte delta to apply (positive = insertion, negative = deletion).
 * @returns A new `FormatRecord` with adjusted trivia offsets.
 *
 * @remarks
 * FR-004: rebaseTrivia is the single derivation for trivia offset adjustment
 * after any edit. Callers must not adjust offsets manually.
 */
export function rebaseTrivia(format: FormatRecord, editStart: number, delta: number): FormatRecord {
	const trivia = rebaseTriviaItems(format.trivia, editStart, delta);
	const kinds = rebaseKinds(format.kinds, editStart, delta);
	return {
		...format,
		...(trivia !== undefined && { trivia }),
		...(kinds !== undefined && { kinds })
	};
}

/** Rebase a trivia array, returning the adjusted array or undefined if absent. */
function rebaseTriviaItems(
	trivia: readonly FormatTrivia[] | undefined,
	editStart: number,
	delta: number
): FormatTrivia[] | undefined {
	if (!trivia) return undefined;
	return trivia.map((item) => {
		if (item.offset < editStart) return item;
		const newOffset = item.offset + delta;
		// Clamp to zero: a large negative delta must not produce a negative
		// offset (negative indices into slice() silently corrupt output).
		return { ...item, offset: Math.max(0, newOffset) };
	});
}

/** Recursively rebase all sub-records in `kinds`. */
function rebaseKinds(
	kinds: Record<string, FormatRecord> | undefined,
	editStart: number,
	delta: number
): Record<string, FormatRecord> | undefined {
	if (!kinds) return undefined;
	const result: Record<string, FormatRecord> = {};
	for (const [key, sub] of Object.entries(kinds)) {
		result[key] = rebaseTrivia(sub, editStart, delta);
	}
	return result;
}
