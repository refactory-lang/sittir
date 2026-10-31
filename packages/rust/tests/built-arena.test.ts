import { describe, expect, it } from 'vitest';
import { BuiltArena, builtCell, cellFormatOf, chunkOf, decodeBuiltCell, unitCell, wordOf } from '@sittir/common/engine';
import { builtRecordOf, handleDispose, LEAF_SITES, positionWords, storeCell, storeList, storeListOptions, writeLeafSites } from '@sittir/common/utils';
import type { BuiltText, LeafSite, TreeHandle } from '@sittir/common/utils';
import { leafSitesOf, placeLeaf } from '../../common/src/built-ref.ts';
import { PLAIN_KINDS, setTriviaOf } from '../../common/src/node-data.ts';
import { getActiveBackend } from '../src/backend.ts';

const backend = getActiveBackend();
const format = backend.name === 'native' ? cellFormatOf(backend.native) : undefined;
type Records = ConstructorParameters<typeof BuiltArena>[0];
type SideStore = Records['trivia'];
const NO_SIDES: SideStore = {
	triviaSide: () => undefined,
	writeTriviaSide: () => undefined,
	unitSides: () => [],
	writeUnitSides: () => undefined,
	writeLeafSide: () => undefined,
	leafSide: () => undefined,
	copySites: () => undefined
};
type Views = ConstructorParameters<typeof BuiltArena>[3];
type WriteLeafSites = ConstructorParameters<typeof BuiltArena>[4];
const NO_VIEWS: Views = { withs: {}, words: {}, cells: {}, leaves: {} };

const metaBytes = (words: number): number => {
	const blocks = Math.ceil(words / 64);
	return 8 + blocks * 8 + Math.ceil(blocks / 2) * 4 + Math.ceil(words / 2);
};

function chunksOf() {
	let made = 0;
	return {
		words: (length: number) => ({ chunk: ++made, data: new Uint32Array(length), meta: new Uint8Array(metaBytes(length)), freed: [] }),
		bytes: (length: number) => ({ chunk: ++made, data: new Uint8Array(length), meta: new Uint8Array(4), freed: [] })
	};
}

const arenaOf = (trivia: SideStore = NO_SIDES, views: Views = NO_VIEWS, leafSites: WriteLeafSites = () => undefined): BuiltArena =>
	new BuiltArena(
		{ format: format!, owner: {}, kinds: PLAIN_KINDS, ...chunksOf(), bump: () => undefined, release: () => [], trivia },
		(data) => ({ ...data, $words: positionWords(data as never), [Symbol.dispose]: handleDispose }),
		{ current: {} as never, settle: <T>(node: T): T => node, hydrate: () => undefined, querySlots: {}, structure: {} } as never,
		views,
		leafSites
	);

const leafOf =
	(kind: number) =>
	(tree: TreeHandle, entry: BuiltText, site: LeafSite | undefined): object => ({ $type: kind, $tree: tree, $entry: entry, $site: site, [Symbol.dispose]: handleDispose });

const placed = (arena: BuiltArena, node: object, words: number): number[] => {
	const at = builtRecordOf(node, arena)!;
	return Array.from(arena.words(at, words).subarray(wordOf(at, format!), wordOf(at, format!) + words));
};

describe('a built arena', () => {
	it('never allocates address 0, and gives each record its kind and no side record', () => {
		const arena = arenaOf();
		const first = arena.draft(7, 4);
		first.data[first.base + 3] = 5;
		const node = arena.view(first);
		expect(builtRecordOf(node, arena)).not.toBe(0);
		expect(placed(arena, node, 4)).toEqual([7, 0, 0, 5]);
		const second = arena.draft(8, 4);
		expect(Array.from(second.data.subarray(second.base, second.base + 4))).toEqual([8, 0, 0, 0]);
	});

	it('writes a draft in place, so its handle names the address it was drafted at', () => {
		const arena = arenaOf();
		const record = arena.draft(9, 7);
		const child = arena.view(arena.draft(4, 2));
		storeCell(arena, record, 2, 2, child);
		const at = builtRecordOf(arena.view(record), arena)!;
		expect(at).toBe(record.at);
		const cell = decodeBuiltCell(arena, arena.words(at, 7)[wordOf(at, format!) + 2]!);
		expect(cell.form === 'child' && cell.at).toBe(builtRecordOf(child, arena));
	});

	it('gives each draft words of its own, which no later draft shares', () => {
		const arena = arenaOf();
		const outer = arena.draft(9, 7);
		const inner = arena.draft(4, 2);
		const next = arena.draft(8, 3);
		inner.data[inner.base + 1] = 7;
		outer.data[outer.base + 3] = 5;
		next.data[next.base + 2] = 6;
		const innerNode = arena.view(inner);
		expect(placed(arena, arena.view(outer), 7)).toEqual([9, 0, 0, 5, 0, 0, 0]);
		expect(placed(arena, arena.view(next), 3)).toEqual([8, 0, 6]);
		expect(placed(arena, innerNode, 2)).toEqual([4, 7]);
		const first = arena.draft(7, 4);
		for (let n = 0; n < 3000; n++) arena.view(arena.draft(1, 3));
		const wide = arena.draft(6, 5000);
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
		const a = builtRecordOf(arena.view(arena.draft(7, 2)), arena)!;
		const b = builtRecordOf(arena.view(arena.draft(7, 2)), arena)!;
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

	it('refuses a handle whose chunk was freed and its number given to a new chunk, and releases nothing through it', () => {
		const released: number[] = [];
		let next = 0;
		const words = (length: number) => ({ chunk: 1, data: new Uint32Array(length), meta: new Uint8Array(metaBytes(length)), freed: next++ === 0 ? [] : [1] });
		const arena = new BuiltArena(
			{ format: format!, owner: {}, kinds: PLAIN_KINDS, words, bytes: chunksOf().bytes, bump: () => undefined, release: (at: number) => (released.push(at), []), trivia: NO_SIDES },
			(data) => ({ ...data, $words: positionWords(data as never), [Symbol.dispose]: handleDispose }),
			{ current: {} as never, settle: <T>(node: T): T => node, hydrate: () => undefined, querySlots: {}, structure: {} } as never,
			NO_VIEWS,
			() => undefined
		);
		const wide = 2 ** format!.chunkShift + 1;
		const stale = arena.view(arena.draft(7, wide));
		const fresh = arena.view(arena.draft(8, wide));
		expect(builtRecordOf(fresh, arena)).toBe((stale as { readonly $at: number }).$at);
		expect(() => builtRecordOf(stale, arena)).toThrow('the chunk its record was in is freed');
		arena.releaseHandle(stale);
		expect(released).toEqual([]);
		arena.releaseHandle(fresh);
		expect(released).toEqual([(fresh as { readonly $at: number }).$at]);
	});

	it('keeps every outstanding draft whole', () => {
		const arena = arenaOf();
		const outstanding = arena.draft(9, 3);
		const next = arena.draft(8, 3);
		outstanding.data[outstanding.base + 2] = 5;
		expect(placed(arena, arena.view(outstanding), 3)).toEqual([9, 0, 5]);
		expect(placed(arena, arena.view(next), 3)).toEqual([8, 0, 0]);
	});

	it('grows its shared chunks by doubling, and gives a run past a chunk its own', () => {
		const arena = arenaOf();
		const sizes = new Set<number>();
		let previous = -1;
		for (let n = 0; n < 5000; n++) {
			const place = arena.run(2);
			const chunk = chunkOf(place.at, format!);
			if (chunk !== previous) sizes.add(place.data.length);
			previous = chunk;
		}
		expect([...sizes]).toEqual([1024, 2048, 4096, 8192]);
		const limit = 2 ** format!.chunkShift;
		const own = arena.run(limit);
		expect(wordOf(own.at, format!)).toBe(0);
		expect(own.data.length).toBe(limit + 1);
		expect(chunkOf(arena.run(2).at, format!)).toBe(previous);
	});

	it('writes no run for an empty list, whose cell stays 0', () => {
		const arena = arenaOf();
		const record = arena.draft(9, 4);
		const before = arena.chunks().words.map((chunk) => chunk.length);
		storeList(arena, record, 2, 2, []);
		expect(record.data[record.base + 2]).toBe(0);
		expect(arena.chunks().words.map((chunk) => chunk.length)).toEqual(before);
	});

	it('interns a leaf entry per kind and text, and reads its kind and text back by address', () => {
		const arena = arenaOf();
		const shared = arena.entry(4, 'shared');
		expect(arena.entry(4, 'shared')).toBe(shared);
		expect(arena.entry(5, 'shared')).not.toBe(shared);
		expect(arena.entryAt(shared.at)).toMatchObject({ kind: 4, len: 6 });
		expect(arena.entryText(arena.entryAt(shared.at).entry)).toBe('shared');
		const wide = arena.entry(4, 'héllo 🌍');
		expect(arena.entryAt(wide.at).len).toBe(new TextEncoder().encode('héllo 🌍').length);
		expect(arena.entryText(arena.entryAt(wide.at).entry)).toBe('héllo 🌍');
		expect(arena.entryText(arena.entryAt(arena.entry(4, '').at).entry)).toBe('');
	});

	it('refuses a read past its written words', () => {
		const arena = arenaOf();
		const place = arena.run(3);
		expect(() => arena.words(place.at, 5)).toThrow(/past its arena's words/);
	});

	it('writes units, captured text and lists of them as the cell decoder reads them', () => {
		const arena = arenaOf();
		const record = arena.draft(9, 5);
		storeCell(arena, record, 2, 2, 12);
		storeCell(arena, record, 3, 3, 'x');
		storeList(arena, record, 4, 4, ['a', 'b']);
		const words = record.data;
		expect(words[record.base + 2]).toBe(unitCell(12, format!));
		expect(decodeBuiltCell(arena, words[record.base + 2]!)).toEqual({ form: 'unit', kind: 12, row: undefined });
		const text = decodeBuiltCell(arena, words[record.base + 3]!);
		expect(text.form === 'builtText' && arena.entryText(arena.entryAt(text.offset).entry)).toBe('x');
		const run = words[record.base + 4]! >>> 2;
		const items = arena.words(run, 3);
		const start = wordOf(run, format!);
		expect(items[start]).toBe(2);
		const second = decodeBuiltCell(arena, items[start + 2]!);
		expect(second.form === 'builtText' && arena.entryText(arena.entryAt(second.offset).entry)).toBe('b');
	});

	it('reads the edges a cell marks its site changed from the cell word', () => {
		const arena = arenaOf();
		const child = builtRecordOf(arena.view(arena.draft(4, 2)), arena)!;
		expect(decodeBuiltCell(arena, builtCell(child, 1))).toMatchObject({ form: 'child', at: child, changed: { leading: true, trailing: false } });
		expect(decodeBuiltCell(arena, builtCell(child, 3))).toMatchObject({ changed: { leading: true, trailing: true } });
		expect(() => decodeBuiltCell(arena, unitCell(12, format!) | 1)).toThrow(/marks changed edges/);
	});

	it('names a built leaf by its kind and its interned text, and writes it no record', () => {
		const arena = arenaOf();
		const before = arena.chunks().words.map((chunk) => chunk.length);
		const leaf = arena.leaf(leafOf(4), 'name');
		expect(arena.chunks().words.map((chunk) => chunk.length)).toEqual(before);
		expect(builtRecordOf(leaf, arena)).toBeUndefined();
		const record = arena.draft(9, 7);
		storeCell(arena, record, 2, 2, leaf);
		const cell = decodeBuiltCell(arena, record.data[record.base + 2]!);
		expect(cell.form).toBe('builtLeaf');
		if (cell.form !== 'builtLeaf') return;
		expect([cell.kind, arena.entryText(arena.entryAt(cell.offset).entry), cell.changed]).toEqual([4, 'name', { leading: false, trailing: false }]);
	});

	it('records each site a built leaf is placed at, in a field its first placement adds', () => {
		const arena = arenaOf();
		const leaf = arena.leaf(leafOf(4), 'name');
		expect(LEAF_SITES in leaf).toBe(false);
		const one = arena.draft(9, 7);
		storeCell(arena, one, 2, 2, leaf);
		const first = builtRecordOf(arena.view(one), arena)!;
		const two = arena.draft(9, 13);
		storeList(arena, two, 11, 11, ['a', leaf]);
		const second = builtRecordOf(arena.view(two), arena)!;
		expect(leafSitesOf(leaf)).toEqual([first, 2, 0, second, 11, 1]);
	});

	it('packs one leaf site and preserves multiple sites and sites too wide to pack', () => {
		const once: { [LEAF_SITES]?: unknown } = {};
		placeLeaf(once, 0xffffffff, 127, 16383);
		expect(typeof once[LEAF_SITES]).toBe('number');
		expect(leafSitesOf(once)).toEqual([0xffffffff, 127, 16383]);
		placeLeaf(once, 5, 2, 0);
		expect(leafSitesOf(once)).toEqual([0xffffffff, 127, 16383, 5, 2, 0]);
		const wide: { [LEAF_SITES]?: unknown } = {};
		placeLeaf(wide, 5, 128, 0);
		placeLeaf(wide, 6, 2, 16384);
		expect(leafSitesOf(wide)).toEqual([5, 128, 0, 6, 2, 16384]);
	});

	it('writes the sides of a leaf it places only when the leaf holds some', () => {
		const written: [readonly number[], string, readonly unknown[]][] = [];
		const arena = arenaOf({ ...NO_SIDES, writeLeafSide: (sites, side, entries) => void written.push([[...sites], side, entries]) }, NO_VIEWS, writeLeafSites);
		const bare = arena.leaf(leafOf(4), 'a');
		const sided = arena.leaf(leafOf(4), 'b');
		setTriviaOf(sided, { leading: [3] });
		const record = arena.draft(9, 13);
		storeCell(arena, record, 2, 2, bare);
		storeList(arena, record, 11, 11, [sided]);
		const at = builtRecordOf(arena.view(record), arena)!;
		expect([leafSitesOf(bare), leafSitesOf(sided)]).toEqual([
			[at, 2, 0],
			[at, 11, 0]
		]);
		expect(written).toEqual([[[at, 11, 0], 'leading', [3]]]);
	});

	it('drafts a record of its kind at the width its builders write, and refuses a kind no builder writes', () => {
		const arena = arenaOf(NO_SIDES, { ...NO_VIEWS, words: { 9: 13 } });
		expect(arena.record(9).words).toBe(13);
		expect(() => arena.record(8)).toThrow(/no width/);
	});

	it('copies a record rebuilt from a parsed node, naming that node beside its list settings, and copies its sites natively', () => {
		const copied: [number, number, readonly number[]][] = [];
		const leafSided: number[][] = [];
		const arena = arenaOf(
			{ ...NO_SIDES, copySites: (from, to, skip) => void copied.push([from, to, [...skip]]), writeLeafSide: (sites) => void leafSided.push([...sites]) },
			{ ...NO_VIEWS, words: { 9: 13 } },
			writeLeafSites
		);
		const leaf = arena.leaf(leafOf(4), 'a');
		setTriviaOf(leaf, { leading: [3] });
		const record = arena.record(9);
		storeList(arena, record, 11, 11, [leaf]);
		storeListOptions(arena, record, 3, 6);
		const node = arena.view(record);
		const at = builtRecordOf(node, arena)!;
		const copy = arena.rebuiltFrom(node, { id: 7 } as never, {} as never, 21, 25, { start: 40, end: 52 }, false);
		const copiedAt = builtRecordOf(copy, arena)!;
		expect(copiedAt).not.toBe(at);
		const [kind, side, ...cells] = placed(arena, copy, 13);
		expect([kind, ...cells]).toEqual([9, ...placed(arena, node, 13).slice(2)]);
		expect(Array.from(arena.words(side!, 8).subarray(wordOf(side!, format!), wordOf(side!, format!) + 8))).toEqual([
			format!.sideSides.bit | format!.sideDelimiter | format!.sideSeparatorKind,
			7, 21, 25, 40, 52,
			3, 6
		]);
		expect(leafSitesOf(leaf)).toEqual([at, 11, 0]);
		expect(leafSided).toEqual([[at, 11, 0]]);
		expect(copied).toEqual([[at, copiedAt, []]]);
	});

	it('answers the handle of a record by its address', () => {
		const arena = arenaOf();
		const at = builtRecordOf(arena.view(arena.draft(4, 2)), arena)!;
		expect(builtRecordOf(arena.node(at), arena)).toBe(at);
	});

	it('refuses a child no builder of the arena made', () => {
		const arena = arenaOf();
		const record = arena.draft(9, 7);
		expect(() => storeCell(arena, record, 2, 2, { $type: 3 })).toThrow(/its own engine built/);
		const other = arenaOf();
		const child = other.leaf(leafOf(4), 'x');
		expect(() => storeCell(arena, record, 2, 2, child)).toThrow(/its own engine built/);
	});
});
