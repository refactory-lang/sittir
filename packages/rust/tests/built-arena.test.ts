import { describe, expect, it } from 'vitest';
import { BuiltArena, builtCell, cellFormatOf, chunkOf, decodeBuiltCell, unitCell, wordOf } from '@sittir/common/engine';
import { builtRecordOf, childSlot, handleDispose, LEAF_SITES, positionWords, storeCell, storeList, storeListOptions, writeLeafSites } from '@sittir/common/utils';
import type { BuiltText, LeafSite, TreeHandle } from '@sittir/common/utils';
import { patchCell, sideEntryOf } from '../../common/src/built-arena.ts';
import type { RecordHandle } from '../../common/src/handle.ts';
import { leafSitesOf, placeLeaf } from '../../common/src/built-ref.ts';
import { PLAIN_KINDS, setTriviaOf } from '../../common/src/node-data.ts';
import { getActiveBackend } from '../src/backend.ts';

const backend = getActiveBackend();
const format = backend.name === 'native' ? cellFormatOf(backend.native) : undefined;
type Records = ConstructorParameters<typeof BuiltArena>[0];
type SideStore = Records['trivia'];
const NO_SIDES: SideStore = {
	writeTriviaSide: () => undefined,
	writeUnitSides: () => undefined,
	writeLeafSide: () => undefined,
	copySites: () => undefined
};
const noRead = (): never => {
	throw new Error('no read wrote into this arena');
};
const NO_READS: Pick<Records, 'read' | 'parse' | 'query' | 'reads'> = {
	read: () => undefined,
	parse: noRead,
	query: { descendants: noRead, planHolds: noRead },
	reads: { snapshotLayouts: noRead, sides: noRead, unitSides: noRead, writeTriviaSide: noRead, slotLayouts: noRead, slotSeparator: noRead, isEmpty: noRead }
};
type Views = ConstructorParameters<typeof BuiltArena>[3];
type WriteLeafSites = ConstructorParameters<typeof BuiltArena>[4];
const NO_VIEWS: Views = { withs: {}, words: {}, cells: {}, places: {}, leaves: {} };

const metaBytes = (words: number): number => {
	const blocks = Math.ceil(words / 64);
	return 8 + blocks * 8 + Math.ceil(blocks / 2) * 4 + Math.ceil(words / 2);
};

function chunksOf() {
	let made = 0;
	return {
		words: (length: number) => ({ chunk: ++made, data: new Uint32Array(length), meta: new Uint8Array(metaBytes(length)), freed: [] }),
		bytes: (least: number) => ({ chunk: ++made, data: new Uint8Array(Math.max(least, 1024)), meta: new Uint8Array(8), freed: [] })
	};
}

const arenaOf = (trivia: SideStore = NO_SIDES, views: Views = NO_VIEWS, leafSites: WriteLeafSites = () => undefined, chunks: Pick<Records, 'words' | 'bytes'> = chunksOf(), read: Records['read'] = NO_READS.read): BuiltArena =>
	new BuiltArena(
		{ format: format!, owner: {}, kinds: PLAIN_KINDS, ...chunks, bump: () => undefined, release: () => [], cross: () => undefined, ...NO_READS, read, trivia },
		(data) => ({ ...data, $words: positionWords(data as never), [Symbol.dispose]: handleDispose }),
		{ current: {} as never, settle: <T>(node: T): T => node, hydrate: () => undefined, querySlots: {}, structure: {} } as never,
		views,
		leafSites
	);

function readRecordIn(chunk: number): { readonly at: number; readonly counts: Uint8Array; readonly read: Records['read'] } {
	const data = new Uint32Array(2 ** format!.chunkShift);
	const meta = new Uint8Array(metaBytes(data.length));
	const blocks = Math.ceil(data.length / 64);
	const head = new Uint32Array(meta.buffer, 0, 2);
	head[0] = 1;
	head[1] = 1;
	new Uint32Array(meta.buffer, 8, blocks * 2)[0] = 1;
	const counts = new Uint8Array(meta.buffer, 8 + blocks * 8 + Math.ceil(blocks / 2) * 4);
	counts[0] = 1;
	return { at: chunk * 2 ** format!.chunkShift, counts, read: (asked) => (asked === chunk ? { data, meta } : undefined) };
}

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

	it('runs the work waiting in its arena before it names one of its records as a side entry', () => {
		const arena = arenaOf();
		const node = arena.view(arena.draft(7, 2));
		const at = builtRecordOf(node, arena)!;
		const ran: number[] = [];
		arena.defer(at, () => ran.push(at));
		expect(sideEntryOf(node, arena, undefined)).toEqual({ $type: 7, $record: at });
		expect(ran).toEqual([at]);
	});

	it("asks the engine for a read node's sides once and for its unit sides once, apart, and again after one of them is written", () => {
		const asked: number[] = [];
		const askedUnits: number[] = [];
		const written: [number, string][] = [];
		const sides = (node: number) => {
			asked.push(node);
			return { leading: [{ text: `leading ${asked.length}` }], trailing: [], inner: [] };
		};
		const unitSides = (node: number) => {
			askedUnits.push(node);
			return [{ slot: 'body', item: 0, leading: [{ text: 'unit' }] }];
		};
		const record = new Uint32Array(2 ** format!.chunkShift);
		const read = { data: record, meta: new Uint8Array(metaBytes(record.length)) };
		const reads = { ...NO_READS.reads, sides, unitSides, writeTriviaSide: (node: number, side: string) => void written.push([node, side]) };
		const arena = new BuiltArena(
			{ format: format!, owner: {}, kinds: PLAIN_KINDS, ...chunksOf(), bump: () => undefined, release: () => [], cross: () => undefined, ...NO_READS, read: (chunk: number) => (chunk === 9 ? read : undefined), reads, trivia: NO_SIDES },
			(data) => ({ ...data, $words: positionWords(data as never), [Symbol.dispose]: handleDispose }),
			{ current: {} as never, settle: <T>(node: T): T => node, hydrate: () => undefined, querySlots: {}, structure: {} } as never,
			NO_VIEWS,
			() => undefined
		);
		const at = 9 * 2 ** format!.chunkShift + 4;
		for (const key of [at, -77]) {
			asked.length = 0;
			askedUnits.length = 0;
			const first = arena.tree.triviaSide(key, 'leading')!;
			expect(first).toEqual([{ text: 'leading 1' }]);
			first.push({ text: "a caller's own" } as never);
			expect(arena.tree.triviaSide(key, 'leading')).toEqual([{ text: 'leading 1' }]);
			expect(arena.tree.triviaSide(key, 'trailing')).toEqual([]);
			expect(arena.tree.triviaSide(key, 'inner')).toEqual([]);
			expect(askedUnits).toEqual([]);
			expect(arena.tree.unitSides(key)).toEqual([{ slot: 'body', item: 0, leading: [{ text: 'unit' }] }]);
			expect(arena.tree.unitSides(key)).toEqual([{ slot: 'body', item: 0, leading: [{ text: 'unit' }] }]);
			expect(asked).toEqual([key]);
			expect(askedUnits).toEqual([key]);
		}
		arena.tree.writeTriviaSide(-77, 'leading', []);
		expect(written).toEqual([[-77, 'leading']]);
		asked.length = 0;
		askedUnits.length = 0;
		arena.tree.triviaSide(-77, 'trailing');
		arena.tree.triviaSide(at, 'trailing');
		arena.tree.unitSides(-77);
		arena.tree.unitSides(at);
		expect(asked).toEqual([-77, at]);
		expect(askedUnits).toEqual([-77, at]);
	});

	it('keeps the sides a render handed it for a read node, and asks the engine for none', () => {
		const asked: number[] = [];
		const record = new Uint32Array(2 ** format!.chunkShift);
		const read = { data: record, meta: new Uint8Array(metaBytes(record.length)) };
		const reads = { ...NO_READS.reads, sides: (node: number) => (asked.push(node), { leading: [], trailing: [], inner: [] }) };
		const arena = new BuiltArena(
			{ format: format!, owner: {}, kinds: PLAIN_KINDS, ...chunksOf(), bump: () => undefined, release: () => [], cross: () => undefined, ...NO_READS, read: (chunk: number) => (chunk === 9 ? read : undefined), reads, trivia: NO_SIDES },
			(data) => ({ ...data, $words: positionWords(data as never), [Symbol.dispose]: handleDispose }),
			{ current: {} as never, settle: <T>(node: T): T => node, hydrate: () => undefined, querySlots: {}, structure: {} } as never,
			NO_VIEWS,
			() => undefined
		);
		const at = 9 * 2 ** format!.chunkShift + 4;
		const built = (arena.view(arena.draft(7, 4)) as { readonly $at: number }).$at;
		expect(arena.wantsSides(at)).toBe(true);
		expect(arena.wantsSides(built)).toBe(false);
		arena.keepSides(at, { leading: [{ text: 'handed' } as never], trailing: [], inner: [] });
		expect(arena.wantsSides(at)).toBe(false);
		expect(arena.tree.triviaSide(at, 'leading')).toEqual([{ text: 'handed' }]);
		expect(asked).toEqual([]);
		arena.tree.writeTriviaSide(at, 'leading', []);
		expect(arena.wantsSides(at)).toBe(true);
	});

	it("reads a read's records in a chunk number a freed builder chunk had", () => {
		let made = 0;
		const words = (length: number) => ({ chunk: ++made, data: new Uint32Array(length), meta: new Uint8Array(metaBytes(length)), freed: made === 2 ? [1] : [] });
		const record = new Uint32Array(2 ** format!.chunkShift);
		const read = { data: record, meta: new Uint8Array(metaBytes(record.length)) };
		const arena = new BuiltArena(
			{ format: format!, owner: {}, kinds: PLAIN_KINDS, words, bytes: chunksOf().bytes, bump: () => undefined, release: () => [], cross: () => undefined, ...NO_READS, read: (chunk: number) => (made === 2 && chunk === 1 ? read : undefined), trivia: NO_SIDES },
			(data) => ({ ...data, $words: positionWords(data as never), [Symbol.dispose]: handleDispose }),
			{ current: {} as never, settle: <T>(node: T): T => node, hydrate: () => undefined, querySlots: {}, structure: {} } as never,
			NO_VIEWS,
			() => undefined
		);
		const wide = 2 ** format!.chunkShift + 1;
		const at = (arena.view(arena.draft(7, wide)) as { readonly $at: number }).$at;
		expect(chunkOf(at, format!)).toBe(1);
		arena.draft(8, wide);
		expect(arena.reads(at)).toBe(true);
		expect(arena.words(at, 4)).toBe(record);
		expect(arena.holdsRecords(1)).toBe(true);
	});

	it('refuses a handle whose chunk was freed and its number given to a new chunk, and releases nothing through it', () => {
		const released: number[] = [];
		let next = 0;
		const words = (length: number) => ({ chunk: 1, data: new Uint32Array(length), meta: new Uint8Array(metaBytes(length)), freed: next++ === 0 ? [] : [1] });
		const arena = new BuiltArena(
			{ format: format!, owner: {}, kinds: PLAIN_KINDS, words, bytes: chunksOf().bytes, bump: () => undefined, release: (at: number) => (released.push(at), []), cross: () => undefined, ...NO_READS, trivia: NO_SIDES },
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

	it('answers a text interned before its chunk filled with its one entry, from a later chunk too', () => {
		let made = 40;
		const bytes = (least: number) => ({ chunk: ++made, data: new Uint8Array(Math.max(least, 32)), meta: new Uint8Array(8), freed: [] });
		const arena = arenaOf(NO_SIDES, NO_VIEWS, () => undefined, { ...chunksOf(), bytes });
		const first = arena.entry(4, 'name');
		const later = ['aaaaaaaa', 'bbbbbbbb', 'cccccccc', 'dddddddd'].map((text) => arena.entry(4, text));
		expect(new Set(later.map((entry) => chunkOf(entry.at, format!))).size).toBeGreaterThan(1);
		expect(arena.entry(4, 'name')).toBe(first);
		expect(arena.entryText(arena.entryAt(first.at).entry)).toBe('name');
	});

	it("writes a leaf entry at its string chunk's written mark, past the bytes another writer put there", () => {
		const data = new Uint8Array(64).fill(0xaa, 0, 8);
		const meta = new Uint8Array(8);
		const marks = new Uint32Array(meta.buffer);
		marks[1] = 8;
		const arena = arenaOf(NO_SIDES, NO_VIEWS, () => undefined, { ...chunksOf(), bytes: () => ({ chunk: 9, data, meta, freed: [] }) });
		const entry = arena.entry(4, 'name');
		expect([chunkOf(entry.at, format!), wordOf(entry.at, format!)]).toEqual([9, 8]);
		expect(Array.from(data.subarray(0, 8))).toEqual(Array.from({ length: 8 }, () => 0xaa));
		expect(marks[1]).toBe(16);
		expect(arena.entryText(arena.entryAt(entry.at).entry)).toBe('name');
	});

	it('writes a text past a chunk of its own in place at the open chunk when that one has the room', () => {
		const limit = 2 ** format!.chunkShift;
		let made = 30;
		const bytes = (least: number) => ({ chunk: ++made, data: new Uint8Array(Math.max(least, 2 * limit + 64)), meta: new Uint8Array(8), freed: [] });
		const arena = arenaOf(NO_SIDES, NO_VIEWS, () => undefined, { ...chunksOf(), bytes });
		arena.entry(4, 'a');
		const wide = 'x'.repeat(limit + 8);
		const entry = arena.entry(4, wide);
		expect([chunkOf(entry.at, format!), wordOf(entry.at, format!)]).toEqual([31, 8]);
		expect(arena.entryText(arena.entryAt(entry.at).entry)).toBe(wide);
	});

	it('asks for a string chunk with the room an entry needs, and appends to it while it has room', () => {
		let made = 20;
		const asked: number[] = [];
		const bytes = (least: number) => (asked.push(least), { chunk: ++made, data: new Uint8Array(32), meta: new Uint8Array(8), freed: [] });
		const arena = arenaOf(NO_SIDES, NO_VIEWS, () => undefined, { ...chunksOf(), bytes });
		const placed = ['aaaa', 'bbbbbbbb', 'c'.repeat(16)].map((text) => arena.entry(4, text).at);
		expect(asked).toEqual([8, 20]);
		expect(placed.map((at) => [chunkOf(at, format!), wordOf(at, format!)])).toEqual([
			[21, 0],
			[21, 8],
			[22, 0]
		]);
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

	it('refuses a list holding a built leaf past the leaf items a list slot holds in arena storage, and takes text there', () => {
		const arena = arenaOf();
		const limit = 2 ** format!.nodeId.itemBits;
		const items: unknown[] = Array.from({ length: limit + 1 }, () => 'a');
		storeList(arena, arena.draft(9, 13), 11, 11, items);
		items[limit] = arena.leaf(leafOf(4), 'x');
		expect(() => storeList(arena, arena.draft(9, 13), 11, 11, items)).toThrow(
			'a list slot holds a leaf at item 262144, past the 262144 leaf items a list slot holds in arena storage, whose node names give an item 18 bits; object storage holds the list'
		);
	});

	it('drafts a record of its kind at the width its builders write, and refuses a kind no builder writes', () => {
		const arena = arenaOf(NO_SIDES, { ...NO_VIEWS, words: { 9: 13 } });
		expect(arena.record(9).words).toBe(13);
		expect(() => arena.record(8)).toThrow(/no width/);
	});

	it('copies a record rebuilt from a node a read left, naming it by its holder, which it holds, and packed site beside its list settings', () => {
		const leafSided: number[][] = [];
		const holder = readRecordIn(50);
		const arena = arenaOf(
			{ ...NO_SIDES, writeLeafSide: (sites) => void leafSided.push([...sites]) },
			{ ...NO_VIEWS, words: { 9: 13 } },
			writeLeafSites,
			chunksOf(),
			holder.read
		);
		const leaf = arena.leaf(leafOf(4), 'a');
		setTriviaOf(leaf, { leading: [3] });
		const record = arena.record(9);
		storeList(arena, record, 11, 11, [leaf]);
		storeListOptions(arena, record, 3, 6);
		const node = arena.view(record);
		const at = builtRecordOf(node, arena)!;
		const { itemBits, wordBits } = format!.nodeId;
		const copy = arena.rebuiltFromRead(node, -(holder.at * 2 ** (itemBits + wordBits) + 3 * 2 ** wordBits + 21), { start: 40, end: 52 }, false);
		const copiedAt = builtRecordOf(copy, arena)!;
		expect(copiedAt).not.toBe(at);
		const [kind, side, ...cells] = placed(arena, copy, 13);
		expect([kind, ...cells]).toEqual([9, ...placed(arena, node, 13).slice(2)]);
		expect(Array.from(arena.words(side!, 8).subarray(wordOf(side!, format!), wordOf(side!, format!) + 8))).toEqual([
			format!.sideSides.bit | format!.sideDelimiter | format!.sideSeparatorKind,
			holder.at, 3 * 2 ** wordBits + 21, 0, 40, 52,
			3, 6
		]);
		expect(holder.counts[0]).toBe(2);
		expect(leafSitesOf(leaf)).toEqual([at, 11, 0]);
		expect(leafSided).toEqual([[at, 11, 0]]);
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

	it('keeps the cell a copy of a built node sets to the text the node reads, when nothing read the node before the copy', () => {
		const arena = arenaOf(NO_SIDES, { ...NO_VIEWS, words: { 9: 3 } });
		const record = arena.draft(9, 3);
		storeCell(arena, record, 2, 2, 'x');
		const source = arena.view(record) as RecordHandle;
		const copy = arena.copy(source, 9);
		expect(childSlot(source, 2, 1, 0, 2)).toBe('x');
		patchCell(arena, copy, 2, 2, 'x');
		expect(copy.patched).toBeUndefined();
		expect(placed(arena, arena.view(copy), 3)).toEqual(placed(arena, source, 3));
	});

	it('compares a copy of a parsed node against the read cache the node fills, when nothing read the node before the copy', () => {
		const arena = arenaOf(NO_SIDES, { ...NO_VIEWS, words: { 9: 3 } });
		const source = { $type: 9, $tree: {} as TreeHandle, $at: 4, $_layout: undefined, $words: undefined, $cache: undefined } as RecordHandle;
		const copy = arena.copy(source, 9);
		expect(source.$cache).toBeDefined();
		expect(copy.kept).toBe(source.$cache);
	});
});
