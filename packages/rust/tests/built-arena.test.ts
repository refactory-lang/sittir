import { describe, expect, it } from 'vitest';
import { BuiltArena, cellFormatOf, chunkOf, decodeCell, wordOf } from '@sittir/common/engine';
import { builtRecordOf, LEAF_SITES, storeCell, storeList } from '@sittir/common/utils';
import { leafSitesOf } from '../../common/src/built-ref.ts';
import { getActiveBackend } from '../src/backend.ts';

const backend = getActiveBackend();
const format = backend.name === 'native' ? cellFormatOf(backend.native) : undefined;
type SideStore = ConstructorParameters<typeof BuiltArena>[0]['trivia'];
const NO_SIDES: SideStore = {
	triviaSide: () => undefined,
	writeTriviaSide: () => undefined,
	unitSides: () => [],
	writeUnitSides: () => undefined,
	writeLeafSide: () => undefined
};
type Views = ConstructorParameters<typeof BuiltArena>[3];
const arenaOf = (trivia: SideStore = NO_SIDES, views: Views = { rows: {} }): BuiltArena =>
	new BuiltArena(
		{ format: format!, owner: {}, hold: () => undefined, trivia },
		() => ({}),
		{ current: {} as never, settle: <T>(node: T): T => node, hydrate: () => undefined, querySlots: {}, structure: {} } as never,
		views,
		() => undefined
	);

const placed = (arena: BuiltArena, node: object, words: number): number[] => {
	const at = builtRecordOf(node, arena)!;
	return Array.from(arena.words(at, words).subarray(wordOf(at, format!), wordOf(at, format!) + words));
};

describe('a built arena', () => {
	it('never allocates address 0, and gives each record its kind and no side record', () => {
		const arena = arenaOf();
		const first = arena.record(7, 4);
		first.data[first.base + 3] = 5;
		const node = arena.view(first);
		expect(builtRecordOf(node, arena)).not.toBe(0);
		expect(placed(arena, node, 4)).toEqual([7, 0, 0, 5]);
		const second = arena.record(8, 4);
		expect(Array.from(second.data.subarray(second.base, second.base + 4))).toEqual([8, 0, 0, 0]);
	});

	it('places a record when it is viewed, past every record its cells name', () => {
		const arena = arenaOf();
		const record = arena.record(9, 7);
		const child = arena.view(arena.record(4, 2));
		storeCell(arena, record, 2, child);
		const at = builtRecordOf(arena.view(record), arena)!;
		const cell = decodeCell(arena.words(at, 7), wordOf(at, format!) + 2, format!);
		expect(cell.form === 'child' && cell.at).toBe(builtRecordOf(child, arena));
		expect(at).toBeGreaterThan(builtRecordOf(child, arena)!);
	});

	it('gives each draft words of its own, which no later draft shares', () => {
		const arena = arenaOf();
		const outer = arena.record(9, 7);
		const inner = arena.record(4, 2);
		const innerNode = arena.view(inner);
		const next = arena.record(8, 3);
		inner.data[inner.base + 1] = 7;
		outer.data[outer.base + 3] = 5;
		expect(placed(arena, arena.view(outer), 7)).toEqual([9, 0, 0, 5, 0, 0, 0]);
		expect(placed(arena, arena.view(next), 3)).toEqual([8, 0, 0]);
		expect(placed(arena, innerNode, 2)).toEqual([4, 0]);
		const first = arena.record(7, 4);
		for (let n = 0; n < 3000; n++) arena.view(arena.record(1, 3));
		const wide = arena.record(6, 5000);
		first.data[first.base + 3] = 5;
		expect(placed(arena, arena.view(first), 4)).toEqual([7, 0, 0, 5]);
		expect(placed(arena, arena.view(wide), 5000).slice(0, 4)).toEqual([6, 0, 0, 0]);
	});

	it('asks its native side store only about places a write gave sides', () => {
		const asked: string[] = [];
		const stored = new Map<string, readonly unknown[]>();
		const arena = arenaOf({
			...NO_SIDES,
			triviaSide: (at, side) => (asked.push(`${side} of ${at}`), stored.get(`${at} ${side}`) as unknown[] | undefined),
			writeTriviaSide: (at, side, entries) => void stored.set(`${at} ${side}`, entries),
			unitSides: (at) => (asked.push(`units of ${at}`), [...(stored.get(`${at} units`) ?? [])]),
			writeUnitSides: (at, units) => void stored.set(`${at} units`, units)
		});
		const a = builtRecordOf(arena.view(arena.record(7, 2)), arena)!;
		const b = builtRecordOf(arena.view(arena.record(7, 2)), arena)!;
		expect([arena.tree.triviaSide(a, 'leading'), arena.tree.triviaSide(b, 'inner'), arena.tree.unitSides(a)]).toEqual([undefined, undefined, []]);
		expect(asked).toEqual([]);
		arena.tree.writeTriviaSide(a, 'trailing', [3]);
		arena.tree.writeTriviaSide(b, 'leading', []);
		arena.tree.writeUnitSides(b, [{ slot: '_items', item: 0, leading: [4] }]);
		expect(arena.tree.triviaSide(a, 'trailing')).toEqual([3]);
		expect(arena.tree.triviaSide(a, 'leading')).toBeUndefined();
		expect(arena.tree.triviaSide(b, 'leading')).toEqual([]);
		expect(arena.tree.unitSides(a)).toEqual([]);
		expect(arena.tree.unitSides(b)).toEqual([{ slot: '_items', item: 0, leading: [4] }]);
		expect(asked).toEqual([`trailing of ${a}`, `leading of ${b}`, `units of ${b}`]);
	});

	it('keeps every outstanding draft whole', () => {
		const arena = arenaOf();
		const outstanding = arena.record(9, 3);
		const next = arena.record(8, 3);
		outstanding.data[outstanding.base + 2] = 5;
		expect(placed(arena, arena.view(outstanding), 3)).toEqual([9, 0, 5]);
		expect(placed(arena, arena.view(next), 3)).toEqual([8, 0, 0]);
	});

	it('grows its shared chunks by doubling, and gives a run past a chunk its own', () => {
		const arena = arenaOf();
		const sizes = new Set<number>();
		let previous = -1;
		for (let n = 0; n < 5000; n++) {
			const place = arena.run(1, 3);
			const chunk = chunkOf(place.at, format!);
			if (chunk !== previous) sizes.add(place.data.length);
			previous = chunk;
		}
		expect([...sizes]).toEqual([1024, 2048, 4096, 8192]);
		const limit = 2 ** format!.chunkShift;
		const own = arena.run(limit / 5 + 1, 5);
		expect(wordOf(own.at, format!)).toBe(0);
		expect(own.data.length).toBe((limit / 5 + 1) * 5);
		expect(chunkOf(arena.run(1, 3).at, format!)).toBe(previous);
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
		const place = arena.run(1, 3);
		expect(() => arena.words(place.at, 4)).toThrow(/past its arena's words/);
	});

	it('writes units, captured text and lists of them as the cell decoder reads them', () => {
		const arena = arenaOf();
		const record = arena.record(9, 2 + 5 + 4 + 2);
		storeCell(arena, record, 2, 12);
		storeCell(arena, record, 7, 'x');
		storeList(arena, record, 11, ['a', 'b'], 4);
		const words = record.data;
		expect(decodeCell(words, record.base + 2, format!)).toEqual({ form: 'unit', kind: 12, row: undefined });
		const text = decodeCell(words, record.base + 7, format!);
		expect(text.form === 'builtText' && arena.textOf(text.offset, text.len)).toBe('x');
		const [run, len] = [words[record.base + 11]!, words[record.base + 12]!];
		expect(len).toBe(2);
		const items = arena.words(run, 8);
		const second = decodeCell(items, wordOf(run, format!) + 4, format!);
		expect(second.form === 'builtText' && arena.textOf(second.offset, second.len)).toBe('b');
	});

	it('names a built leaf by its kind and its interned text, and writes it no record', () => {
		const arena = arenaOf();
		const before = arena.chunks().words.map((chunk) => chunk.length);
		const leaf = arena.adoptLeaf({ $type: 4 }, 'name');
		expect(arena.chunks().words.map((chunk) => chunk.length)).toEqual(before);
		expect(builtRecordOf(leaf, arena)).toBeUndefined();
		const record = arena.record(9, 7);
		storeCell(arena, record, 2, leaf);
		const cell = decodeCell(record.data, record.base + 2, format!);
		expect(cell.form).toBe('builtLeaf');
		if (cell.form !== 'builtLeaf') return;
		expect([cell.kind, arena.textOf(cell.offset, cell.len), cell.changed]).toEqual([4, 'name', { leading: false, trailing: false }]);
	});

	it('records each site a built leaf is placed at, in the field its literal declares', () => {
		const arena = arenaOf();
		const leaf = arena.adoptLeaf({ $type: 4, [LEAF_SITES]: undefined }, 'name');
		const one = arena.record(9, 7);
		storeCell(arena, one, 2, leaf);
		const first = builtRecordOf(arena.view(one), arena)!;
		const two = arena.record(9, 13);
		storeList(arena, two, 11, ['a', leaf], 5);
		const second = builtRecordOf(arena.view(two), arena)!;
		expect(leafSitesOf(leaf)).toEqual([first, 2, 0, second, 11, 1]);
	});

	it('answers the node a side holds by its address, and refuses an address no side holds', () => {
		const arena = arenaOf();
		const node = arena.view(arena.record(4, 2));
		const at = builtRecordOf(node, arena)!;
		expect(() => arena.node(at)).toThrow(/held by no side/);
		arena.escape(node, at);
		expect(arena.node(at)).toBe(node);
	});

	it('refuses a child no builder of the arena made', () => {
		const arena = arenaOf();
		const record = arena.record(9, 7);
		expect(() => storeCell(arena, record, 2, { $type: 3 })).toThrow(/its own engine built/);
		const other = arenaOf();
		const child = other.adoptLeaf({ $type: 4 }, 'x');
		expect(() => storeCell(arena, record, 2, child)).toThrow(/its own engine built/);
	});
});
