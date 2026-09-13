/** A byte range into a source string, as the reader stamps it. */
export interface ByteSpan {
	readonly start: number;
	readonly end: number;
}

/**
 * Slice a source by byte offsets. A read node's `$span` counts UTF-8 bytes
 * (tree-sitter's byte range), while a JS string indexes UTF-16 code units, so
 * `source.slice(span.start, span.end)` drifts after the first multibyte
 * character. Encoding once and decoding the byte window is the one correct
 * derivation; `spanSlicer` keeps the encoding for a source that is sliced
 * many times.
 */
export function spanSlicer(source: string): (span: ByteSpan) => string {
	const bytes = new TextEncoder().encode(source);
	const decoder = new TextDecoder();
	return (span) => decoder.decode(bytes.subarray(span.start, span.end));
}

export function sliceSpan(source: string, span: ByteSpan): string {
	return spanSlicer(source)(span);
}
