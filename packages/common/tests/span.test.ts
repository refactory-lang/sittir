import { describe, expect, it } from 'vitest';
import { applyEdits } from '../src/edit.ts';
import { sliceSpan, sourceSpans } from '../src/span.ts';

// 17 UTF-16 units, 21 UTF-8 bytes: each Greek letter is two bytes.
const greek = '\nψ1 = β_γ + Ψ_5\n\n';
const statement = { start: 1, end: 19 };

describe('sourceSpans', () => {
	it('slices a source by a byte span', () => {
		expect(sourceSpans(greek).slice(statement)).toBe('ψ1 = β_γ + Ψ_5');
		expect(sliceSpan(greek, statement)).toBe('ψ1 = β_γ + Ψ_5');
	});

	it('gives the string indices of a byte span', () => {
		expect(sourceSpans(greek).toIndices(statement)).toEqual({ start: 1, end: 15 });
	});

	it('gives the byte span of a string index range', () => {
		expect(sourceSpans(greek).toSpan({ start: 1, end: 15 })).toEqual(statement);
	});

	it('counts the source in bytes', () => {
		expect(sourceSpans(greek).byteLength).toBe(21);
	});

	it('leaves an ASCII source\'s positions as they are', () => {
		const spans = sourceSpans('a = b\n');
		expect(spans.toIndices({ start: 2, end: 5 })).toEqual({ start: 2, end: 5 });
		expect(spans.toSpan({ start: 2, end: 5 })).toEqual({ start: 2, end: 5 });
	});
});

describe('applyEdits', () => {
	it('replaces a byte range in a source with multibyte characters', () => {
		// `β_γ` is bytes [7, 12).
		expect(applyEdits(greek, [{ startPos: 7, endPos: 12, insertedText: 'x' }]).source).toBe('\nψ1 = x + Ψ_5\n\n');
	});

	it('applies several edits given in any order', () => {
		const edits = [
			{ startPos: 15, endPos: 19, insertedText: 'ω' },
			{ startPos: 1, endPos: 4, insertedText: 'a' }
		];
		expect(applyEdits(greek, edits).source).toBe('\na = β_γ + ω\n\n');
	});

	it('rejects a range past the end of the source, counted in bytes', () => {
		expect(() => applyEdits(greek, [{ startPos: 20, endPos: 22, insertedText: '' }])).toThrow(/out of bounds/);
		expect(applyEdits(greek, [{ startPos: 20, endPos: 21, insertedText: '' }]).source).toBe('\nψ1 = β_γ + Ψ_5\n');
	});

	it('rejects overlapping edits', () => {
		const edits = [
			{ startPos: 1, endPos: 8, insertedText: 'a' },
			{ startPos: 7, endPos: 12, insertedText: 'b' }
		];
		expect(() => applyEdits(greek, edits)).toThrow(/overlap/);
	});

	it('applies an insertion before a replacement that starts at the same position, in either order', () => {
		const insertion = { startPos: 1, endPos: 1, insertedText: '<' };
		const replacement = { startPos: 1, endPos: 4, insertedText: 'a' };
		expect(applyEdits(greek, [insertion, replacement]).source).toBe('\n<a = β_γ + Ψ_5\n\n');
		expect(applyEdits(greek, [replacement, insertion]).source).toBe('\n<a = β_γ + Ψ_5\n\n');
	});

	it('rejects two insertions at the same position as ambiguous', () => {
		const edits = [
			{ startPos: 1, endPos: 1, insertedText: 'a' },
			{ startPos: 1, endPos: 1, insertedText: 'b' }
		];
		expect(() => applyEdits(greek, edits)).toThrow(/ambiguous/);
	});

	it('rejects two replacements that start at the same position as ambiguous', () => {
		const edits = [
			{ startPos: 1, endPos: 4, insertedText: 'a' },
			{ startPos: 1, endPos: 3, insertedText: 'b' }
		];
		expect(() => applyEdits(greek, edits)).toThrow(/ambiguous/);
	});

	it('keeps a leading byte order mark', () => {
		expect(applyEdits('\uFEFFx', [{ startPos: 3, endPos: 4, insertedText: 'y' }]).source).toBe('\uFEFFy');
	});
});

describe('sourceSpans on a source with a byte order mark', () => {
	const spans = sourceSpans('\uFEFFx');

	it('slices the mark as text', () => {
		expect(spans.slice({ start: 0, end: 3 })).toBe('\uFEFF');
		expect(spans.slice({ start: 0, end: 4 })).toBe('\uFEFFx');
	});

	it('counts the mark as one string index', () => {
		expect(spans.toIndices({ start: 3, end: 4 })).toEqual({ start: 1, end: 2 });
		expect(spans.toSpan({ start: 1, end: 2 })).toEqual({ start: 3, end: 4 });
	});
});
