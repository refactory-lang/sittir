import { describe, expect, it } from 'vitest';
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
