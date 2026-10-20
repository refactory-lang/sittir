import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { addressOf, cellFormatOf, chunkOf, decodeCell, decodeListCell, wordOf, type RecordCell } from '@sittir/common/engine';
import { getActiveBackend } from '../src/backend.ts';

type Entry = Record<string, unknown> & { readonly form: RecordCell['form']; readonly words: readonly number[] };

const fixture = JSON.parse(readFileSync(new URL('../../../rust/crates/sittir-core/src/arena/cell-forms.json', import.meta.url), 'utf8')) as {
	readonly cells: readonly Entry[];
	readonly lists: readonly { readonly run: number; readonly len: number; readonly words: readonly number[] }[];
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
		case 'builtLeaf':
			return { form: 'builtLeaf', kind: entry.kind as number, offset: entry.offset as number, len: entry.len as number, record: entry.record as number };
		case 'builtText':
			return { form: 'builtText', offset: entry.offset as number, len: entry.len as number };
	}
}

describe('the record cell decoder reads what the native codec writes', () => {
	const backend = getActiveBackend();
	const format = backend.name === 'native' ? cellFormatOf(backend.native) : undefined;

	it('takes its tags and address packing from the addon', () => {
		expect(format).toBeDefined();
	});

	it.each(fixture.cells.map((entry) => [JSON.stringify(entry.words), entry] as const))('decodes %s as the codec wrote it', (_, entry) => {
		expect(decodeCell(entry.words, 0, format!)).toEqual(expected(entry));
	});

	it('decodes a cell at its offset in a record', () => {
		const words = [7, 7, ...fixture.cells[1]!.words];
		expect(decodeCell(words, 2, format!)).toEqual(expected(fixture.cells[1]!));
	});

	it('decodes every list cell, and packs and splits every address', () => {
		for (const list of fixture.lists) expect(decodeListCell(list.words, 0)).toEqual({ run: list.run, len: list.len });
		for (const { chunk, word, address } of fixture.addresses) {
			expect(addressOf(chunk, word, format!)).toBe(address);
			expect([chunkOf(address, format!), wordOf(address, format!)]).toEqual([chunk, word]);
		}
	});

	it('refuses a tag no writer writes, and a cell cut short', () => {
		expect(() => decodeCell([6, 0, 0, 0, 0], 0, format!)).toThrow(/cell tag 6, which no record writer writes/);
		expect(() => decodeCell([format!.child, 2, 4], 0, format!)).toThrow(/ends at word 3/);
	});
});
