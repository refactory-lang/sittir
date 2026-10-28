import { describe, expect, it } from 'vitest';
import { FORM, RECORD_HEADER_WORDS, STORED, recordArgs, recordLayoutOf, slotRecordForm } from '../record-layout.ts';

describe('recordLayoutOf', () => {
	it('places the presence bits in words after the header, then each cell in field order, as wide as its forms, with one built word', () => {
		const layout = recordLayoutOf([
			{ field: 'pattern', form: slotRecordForm(false, STORED.record, false) },
			{ field: 'mutable', form: slotRecordForm(true, 0, false) },
			{ field: 'items', form: slotRecordForm(false, STORED.record | STORED.unit, true) },
			{ field: 'text', form: slotRecordForm(false, STORED.text, false) }
		]);
		expect(layout.places).toEqual([
			{ field: 'pattern', word: RECORD_HEADER_WORDS + 1, forms: FORM.node, width: 3, built: RECORD_HEADER_WORDS + 1 },
			{ field: 'mutable', word: RECORD_HEADER_WORDS, bit: 0 },
			{ field: 'items', word: RECORD_HEADER_WORDS + 4, forms: FORM.node | FORM.unit, width: 1, run: 4, built: RECORD_HEADER_WORDS + 2 },
			{ field: 'text', word: RECORD_HEADER_WORDS + 5, forms: FORM.text, width: 2, built: RECORD_HEADER_WORDS + 3 }
		]);
		expect(layout.words).toBe(RECORD_HEADER_WORDS + 7);
		expect(layout.builtWords).toBe(RECORD_HEADER_WORDS + 4);
	});

	it('opens a new presence word every 32 bits', () => {
		const bits = Array.from({ length: 33 }, (_, i) => ({ field: `k${i}`, form: { tag: 'bit' } as const }));
		const layout = recordLayoutOf(bits);
		expect(layout.places.at(31)).toEqual({ field: 'k31', word: RECORD_HEADER_WORDS, bit: 31 });
		expect(layout.places.at(32)).toEqual({ field: 'k32', word: RECORD_HEADER_WORDS + 1, bit: 0 });
		expect(layout.words).toBe(RECORD_HEADER_WORDS + 2);
		expect(layout.builtWords).toBe(RECORD_HEADER_WORDS + 2);
	});

	it('gives a record with no fields its header alone', () => {
		expect(recordLayoutOf([])).toEqual({ words: RECORD_HEADER_WORDS, builtWords: RECORD_HEADER_WORDS, places: [] });
	});

	it("reserves a bounded child's embedded record and stamps its capacity, and a list of them holds their cells", () => {
		const layout = recordLayoutOf([{ field: 'child', form: slotRecordForm(false, STORED.record, false, 7) }]);
		expect(layout).toEqual({ words: 9, builtWords: 3, places: [{ field: 'child', word: 2, forms: FORM.inline, width: 7, inline: 7, built: 2 }] });
		expect(recordArgs(layout.places[0]!)).toBe('word = 2, width = 7, inline = 7, forms = 8, built = 2');
		expect(slotRecordForm(false, STORED.record, true, 7)).toEqual({ tag: 'cell', forms: FORM.node, width: 1, run: 3 });
	});

	it('opens a cell of several forms with a tag word, and a blank arm adds no width', () => {
		expect(slotRecordForm(false, STORED.unit | STORED.blank, false)).toEqual({ tag: 'cell', forms: FORM.unit | FORM.blank, width: 1 });
		expect(slotRecordForm(false, STORED.leaf | STORED.text, false)).toEqual({ tag: 'cell', forms: FORM.node | FORM.text, width: 4 });
	});
});

describe('recordArgs', () => {
	it('spells a cell, a list cell and a bit as the derive reads them on a slot', () => {
		expect(recordArgs({ field: 'a', word: 3, forms: FORM.node, width: 3, built: 2 })).toBe('word = 3, width = 3, forms = 1, built = 2');
		expect(recordArgs({ field: 'a', word: 8, forms: FORM.node, width: 1, run: 3, built: 3 })).toBe('word = 8, width = 1, run = 3, forms = 1, built = 3');
		expect(recordArgs({ field: 'a', word: 2, bit: 7 })).toBe('word = 2, bit = 7');
	});
});
