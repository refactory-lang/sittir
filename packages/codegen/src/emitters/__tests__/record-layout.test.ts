import { describe, expect, it } from 'vitest';
import { CELL_WORDS, RECORD_HEADER_WORDS, recordArgs, recordLayoutOf } from '../record-layout.ts';

describe('recordLayoutOf', () => {
	it('places the presence bits in words after the header, then each cell in field order', () => {
		const layout = recordLayoutOf([
			{ field: 'pattern', form: { tag: 'cell', width: CELL_WORDS.node } },
			{ field: 'mutable', form: { tag: 'bit' } },
			{ field: 'items', form: { tag: 'cell', width: CELL_WORDS.list, run: CELL_WORDS.node } },
			{ field: 'text', form: { tag: 'cell', width: CELL_WORDS.text } }
		]);
		expect(layout.places).toEqual([
			{ field: 'pattern', word: RECORD_HEADER_WORDS + 1, width: 5 },
			{ field: 'mutable', word: RECORD_HEADER_WORDS, bit: 0 },
			{ field: 'items', word: RECORD_HEADER_WORDS + 6, width: 2, run: 5 },
			{ field: 'text', word: RECORD_HEADER_WORDS + 8, width: 4 }
		]);
		expect(layout.words).toBe(RECORD_HEADER_WORDS + 12);
	});

	it('opens a new presence word every 32 bits', () => {
		const bits = Array.from({ length: 33 }, (_, i) => ({ field: `k${i}`, form: { tag: 'bit' } as const }));
		const layout = recordLayoutOf(bits);
		expect(layout.places.at(31)).toEqual({ field: 'k31', word: RECORD_HEADER_WORDS, bit: 31 });
		expect(layout.places.at(32)).toEqual({ field: 'k32', word: RECORD_HEADER_WORDS + 1, bit: 0 });
		expect(layout.words).toBe(RECORD_HEADER_WORDS + 2);
	});

	it('gives a record with no fields its header alone', () => {
		expect(recordLayoutOf([])).toEqual({ words: RECORD_HEADER_WORDS, places: [] });
	});
});

describe('recordArgs', () => {
	it('spells a cell, a list cell and a bit as the derive reads them on a slot', () => {
		expect(recordArgs({ field: 'a', word: 3, width: 5 })).toBe('word = 3, width = 5');
		expect(recordArgs({ field: 'a', word: 8, width: 2, run: 5 })).toBe('word = 8, width = 2, run = 5');
		expect(recordArgs({ field: 'a', word: 2, bit: 7 })).toBe('word = 2, bit = 7');
	});
});
