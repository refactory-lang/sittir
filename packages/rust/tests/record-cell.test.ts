import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
	addressOf,
	cellFormatOf,
	chunkOf,
	decodeListCell,
	decodeParsedCell,
	decodeSideDelimiter,
	decodeSideRow,
	wordOf,
	type RecordCell
} from '@sittir/common/engine';
import { getActiveBackend } from '../src/backend.ts';

type Entry = Record<string, unknown> & {
	readonly form: RecordCell['form'];
	readonly forms: number;
	readonly inline?: number;
	readonly address?: number;
	readonly words: readonly number[];
};

const fixture = JSON.parse(
	readFileSync(new URL('../../../rust/crates/sittir-core/src/arena/cell-forms.json', import.meta.url), 'utf8')
) as {
	readonly parsed: { readonly headerWords: number; readonly cells: readonly Entry[] };
	readonly built: {
		readonly chunks: readonly { readonly chunk: number; readonly words?: readonly number[] }[];
		readonly lists: readonly { readonly word: number; readonly run: number; readonly len: number }[];
	};
	readonly sides: readonly {
		readonly row: {
			readonly index: number;
			readonly end: number;
			readonly start: number;
			readonly endByte: number;
		} | null;
		readonly delimiter: number | null;
		readonly words: readonly number[];
	}[];
	readonly addresses: readonly { readonly chunk: number; readonly word: number; readonly address: number }[];
};

function expected(entry: Entry): RecordCell {
	const span = { start: entry.start as number, end: entry.end as number };
	switch (entry.form) {
		case 'absent':
			return { form: 'absent' };
		case 'coordinate':
			return { form: 'coordinate', kind: entry.kind as number, index: entry.index as number, span };
		case 'parsedLeaf':
			return { form: 'parsedLeaf', kind: entry.kind as number, span, row: entry.row as number };
		case 'parsedText':
			return { form: 'parsedText', span };
		case 'child':
			return {
				form: 'child',
				kind: entry.kind as number,
				at: entry.at as number,
				link: (entry.link as number | null) ?? undefined,
				changed: { leading: entry.leading as boolean, trailing: entry.trailing as boolean }
			};
		case 'unit':
			return { form: 'unit', kind: entry.kind as number, row: (entry.row as number | null) ?? undefined };
		default:
			throw new Error(`the parsed fixture holds no ${entry.form} cell`);
	}
}

describe('the record cell decoder reads what the native codec writes', () => {
	const backend = getActiveBackend();
	const format = backend.name === 'native' ? cellFormatOf(backend.native) : undefined;

	it('takes its tags, forms and address packing from the addon', () => {
		expect(format).toBeDefined();
	});

	it.each(fixture.parsed.cells.map((entry) => [JSON.stringify(entry.words), entry.forms, entry] as const))(
		'decodes %s in a slot of forms %i as the codec wrote it',
		(_, forms, entry) => {
			expect(decodeParsedCell(entry.words, 0, forms, format!, entry.inline, entry.address)).toEqual(expected(entry));
		}
	);

	it('decodes a cell at its offset in a record', () => {
		const entry = fixture.parsed.cells.find((cell) => cell.form === 'coordinate')!;
		expect(decodeParsedCell([7, 7, ...entry.words], 2, entry.forms, format!)).toEqual(expected(entry));
	});

	it('resolves an embedded record within its stamped capacity, at least a record header', () => {
		for (const entry of fixture.parsed.cells.filter((cell) => cell.address !== undefined)) {
			const { forms, inline, address, words } = entry;
			expect(() => decodeParsedCell(words, 0, forms, format!, fixture.parsed.headerWords - 1, address)).toThrow(/stamped capacity/);
			expect(() => decodeParsedCell(words.slice(0, -1), 0, forms, format!, inline, address)).toThrow(/stamped capacity/);
			expect(() => decodeParsedCell(words, 0, forms, format!, inline, 0)).toThrow(/stamped capacity/);
		}
	});

	it('decodes every list cell, and packs and splits every address', () => {
		const chunks = new Map(fixture.built.chunks.flatMap(({ chunk, words }) => (words === undefined ? [] : [[chunk, Uint32Array.from(words)] as const])));
		const records = { format: format!, words: (address: number) => chunks.get(chunkOf(address, format!))! };
		for (const list of fixture.built.lists) expect(decodeListCell(records, list.word)).toEqual({ run: list.run, len: list.len });
		for (const { chunk, word, address } of fixture.addresses) {
			expect(addressOf(chunk, word, format!)).toBe(address);
			expect([chunkOf(address, format!), wordOf(address, format!)]).toEqual([chunk, word]);
		}
	});

	it("reads each side record's row and delimiters setting past the fields before it", () => {
		for (const side of fixture.sides) {
			const row =
				side.row === null
					? undefined
					: { index: side.row.index, end: side.row.end, span: { start: side.row.start, end: side.row.endByte } };
			expect(decodeSideRow(side.words, 0, format!)).toEqual(row);
			expect(decodeSideDelimiter(side.words, 0, format!)).toBe(side.delimiter ?? undefined);
		}
	});

	it('refuses a tag no writer writes, and a cell cut short', () => {
		const tagged = format!.forms.node | format!.forms.text;
		expect(() => decodeParsedCell([0xffffffff, 0, 0, 0], 0, tagged, format!)).toThrow(/cell tag 4294967295, which no record writer writes/);
		expect(() => decodeParsedCell([format!.tag.unit, 0, 0, 0], 0, tagged, format!)).toThrow(/which its slot of forms 5 does not hold/);
		const coordinate = fixture.parsed.cells.find((cell) => cell.form === 'coordinate' && cell.forms === tagged)!;
		expect(() => decodeParsedCell(coordinate.words.slice(0, -1), 0, tagged, format!)).toThrow(/ends at word 3/);
	});
});
