import { describe, expect, it } from 'vitest';
import { BuiltArena, cellFormatOf, chunkOf, decodeCell, wordOf } from '@sittir/common/engine';
import { storeCell, storeList } from '@sittir/common/utils';
import { getActiveBackend } from '../src/backend.ts';

const backend = getActiveBackend();
const format = backend.name === 'native' ? cellFormatOf(backend.native) : undefined;
const arenaOf = (): BuiltArena =>
	new BuiltArena(format!, () => ({}), { current: {} as never, settle: <T>(node: T): T => node, hydrate: () => undefined } as never);

describe('a built arena', () => {
	it('never allocates address 0, and gives each record its kind and no side record', () => {
		const arena = arenaOf();
		const first = arena.record(7, 4);
		expect(first.at).not.toBe(0);
		expect(Array.from(arena.words(first.at, 4).subarray(first.base, first.base + 4))).toEqual([7, 0, 0, 0]);
	});

	it('grows its shared chunks by doubling, and gives a run past a chunk its own', () => {
		const arena = arenaOf();
		const sizes = new Set<number>();
		let previous = -1;
		for (let n = 0; n < 5000; n++) {
			const place = arena.record(1, 3);
			const chunk = chunkOf(place.at, format!);
			if (chunk !== previous) sizes.add(place.data.length);
			previous = chunk;
		}
		expect([...sizes]).toEqual([1024, 2048, 4096, 8192]);
		const limit = 2 ** format!.chunkShift;
		const own = arena.run(limit / 5 + 1, 5);
		expect(wordOf(own.at, format!)).toBe(0);
		expect(own.data.length).toBe((limit / 5 + 1) * 5);
		expect(chunkOf(arena.record(1, 3).at, format!)).toBe(previous);
	});

	it('names an empty run by address 0 and allocates nothing for it', () => {
		const arena = arenaOf();
		const before = arena.chunks().words.map((chunk) => chunk.length);
		expect(arena.run(0, 5).at).toBe(0);
		expect(arena.chunks().words.map((chunk) => chunk.length)).toEqual(before);
	});

	it('interns text once, keeps empty text out of its bytes, and reads text back by offset', () => {
		const arena = arenaOf();
		const empty = arena.text('');
		const shared = arena.text('shared');
		expect(empty).toEqual({ at: 0, len: 0 });
		expect(arena.text('shared')).toBe(shared);
		expect(arena.textOf(empty.at, empty.len)).toBe('');
		expect(arena.textOf(shared.at, shared.len)).toBe('shared');
		const wide = arena.text('héllo 🌍');
		expect(wide.len).toBe(new TextEncoder().encode('héllo 🌍').length);
		expect(arena.textOf(wide.at, wide.len)).toBe('héllo 🌍');
		expect(arena.textOf(shared.at, 3)).toBe('sha');
		expect(() => arena.textOf(wide.at, wide.len + 64)).toThrow(/past its arena's bytes/);
	});

	it('refuses a read past its written words', () => {
		const arena = arenaOf();
		const place = arena.record(1, 3);
		expect(() => arena.words(place.at, 4)).toThrow(/past its arena's words/);
	});

	it('writes units, captured text and lists of them as the cell decoder reads them', () => {
		const arena = arenaOf();
		const record = arena.record(9, 2 + 5 + 4 + 2);
		storeCell(arena, record.data, record.base + 2, 12);
		storeCell(arena, record.data, record.base + 7, 'x');
		storeList(arena, record.data, record.base + 11, ['a', 'b'], 4);
		const words = arena.words(record.at, 13);
		expect(decodeCell(words, record.base + 2, format!)).toEqual({ form: 'unit', kind: 12, row: undefined });
		const text = decodeCell(words, record.base + 7, format!);
		expect(text.form === 'builtText' && arena.textOf(text.offset, text.len)).toBe('x');
		const [run, len] = [words[record.base + 11]!, words[record.base + 12]!];
		expect(len).toBe(2);
		const items = arena.words(run, 8);
		const second = decodeCell(items, wordOf(run, format!) + 4, format!);
		expect(second.form === 'builtText' && arena.textOf(second.offset, second.len)).toBe('b');
	});

	it('names a built leaf by its kind, its interned text and its own record', () => {
		const arena = arenaOf();
		const leaf = arena.adoptLeaf({ $type: 4 }, 4, 2, 'name');
		const record = arena.record(9, 7);
		storeCell(arena, record.data, record.base + 2, leaf);
		const cell = decodeCell(arena.words(record.at, 7), record.base + 2, format!);
		expect(cell.form).toBe('builtLeaf');
		if (cell.form !== 'builtLeaf') return;
		expect([cell.kind, arena.textOf(cell.offset, cell.len)]).toEqual([4, 'name']);
		expect(arena.leaf(cell.record)).toBe(leaf);
	});

	it('refuses a child no builder of the arena made', () => {
		const arena = arenaOf();
		const record = arena.record(9, 7);
		expect(() => storeCell(arena, record.data, record.base + 2, { $type: 3 })).toThrow(/its own engine built/);
		const other = arenaOf();
		const child = other.adoptLeaf({ $type: 4 }, 4, 2, 'x');
		expect(() => storeCell(arena, record.data, record.base + 2, child)).toThrow(/its own engine built/);
	});
});
