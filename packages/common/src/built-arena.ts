import type { EngineIdentity, NodeCoordinate } from '@sittir/types';
import { bindTree, engineOf, sameLanguage, treeBuiltArena, type TreeEngineHandle } from './engine-scope.ts';
import { wrapRegistered, type Role } from './identity.ts';
import { changedEdges, coordinateOf, holdReadTree, isRead, isRebuilt, NO_EDGES, type ChangedEdges, type KindView } from './node-data.ts';
import { decodeIndex, decodeTree, isCoordinate } from './read.ts';
import { treeOf, treeTokenOf, type TreeToken } from './tree-token.ts';
import type { ChunkWords, RecordReader, TreeHandle, TriviaSideName } from './read.ts';
import { addressOf, chunkOf, headerKind, kindField, withKind, wordOf, type CellFormat, type RecordCell } from './record-cell.ts';
import { builtRefOf, packSite, placeLeaf, type BuiltRecordRef, type BuiltRef } from './built-ref.ts';
import { leafData, recordDelimiter, recordOf, recordSeparator, recordStub } from './record-view.ts';
import type { LeafMaker, RecordPosition } from './handle.ts';
import { forEachTriviaList, mapTriviaEntries, type TriviaSides } from './trivia.ts';

/** A leaf entry of a built arena: its packed address in a string chunk, 0 before its leaf is first placed, its text, and the chunk it lies in. */
export interface BuiltText {
	readonly at: number;
	readonly text: string | undefined;
	readonly data?: Uint8Array;
}

export type WritableWords = Uint32Array;

export interface BuiltWords {
	readonly data: WritableWords;
	readonly base: number;
	readonly words: number;
}

export interface BuiltPlace extends BuiltWords {
	readonly at: number;
}

export interface BuiltDraft extends BuiltWords {
	placed: unknown[] | undefined;
	readonly copyOf: number | undefined;
	readonly kept: Readonly<Record<number, unknown>> | undefined;
	patched: number[] | undefined;
}

type Wrap = (data: object, tree: TreeHandle) => unknown;

export interface BuiltChunks {
	readonly words: readonly WritableWords[];
	readonly bytes: readonly Uint8Array[];
}

export interface BuiltChunk<A extends WritableWords | Uint8Array> {
	readonly chunk: number;
	readonly data: A;
	readonly meta: Uint8Array;
	readonly freed: readonly number[];
}

export interface BuiltRecords {
	readonly format: CellFormat;
	readonly owner: object;
	readonly kinds: KindView;
	words(length: number): BuiltChunk<WritableWords>;
	bytes(length: number): BuiltChunk<Uint8Array>;
	counts(chunk: number, segment: number): Uint8Array;
	bump(at: number): void;
	release(at: number, held: number, owned: boolean): readonly number[];
	readonly trivia: {
		triviaSide(at: number, side: TriviaSideName): unknown[] | undefined;
		writeTriviaSide(at: number, side: TriviaSideName, entries: readonly unknown[]): void;
		unitSides(at: number): unknown[];
		writeUnitSides(at: number, units: readonly unknown[]): void;
		writeLeafSide(sites: readonly number[], side: TriviaSideName, entries: readonly unknown[]): void;
		leafSide(holder: number, word: number, item: number, side: TriviaSideName): unknown[] | undefined;
		copySites(from: number, to: number, skip: readonly number[]): void;
	};
}

export type WriteLeafSites = (leaf: object, sites: readonly number[]) => void;

const FIRST_CHUNK_WORDS = 1 << 10;
const FIRST_STRING_BYTES = 1 << 10;
const DRAFT_WORDS = 1 << 12;
const ENTRY_HEAD_BYTES = 4;
const releasedRecord = (at: number): string => `the built node at ${at} was released: its record holds no count`;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

function units(size: number, least: number): void {
	if (!Number.isSafeInteger(size) || size < least) throw new Error(`a built arena cannot allocate ${size} units`);
}

class Chunks<A extends WritableWords | Uint8Array> {
	readonly #make: (length: number) => BuiltChunk<A>;
	readonly #opened: (chunk: number, data: A, meta: Uint8Array) => void;
	readonly #freed: (chunks: readonly number[]) => void;
	readonly #empty: A;
	readonly #first: number;
	readonly #limit: number;
	readonly chunks: A[] = [];
	readonly used: number[] = [];
	#open = -1;

	constructor(
		make: (length: number) => BuiltChunk<A>,
		opened: (chunk: number, data: A, meta: Uint8Array) => void,
		freed: (chunks: readonly number[]) => void,
		empty: A,
		first: number,
		format: CellFormat
	) {
		this.#make = make;
		this.#opened = opened;
		this.#freed = freed;
		this.#empty = empty;
		this.#limit = 2 ** format.chunkShift;
		this.#first = Math.min(first, this.#limit);
	}

	alloc(size: number): { readonly chunk: number; readonly word: number; readonly data: A } {
		units(size, 0);
		if (size > this.#limit) {
			const own = this.#push(size);
			this.used[own] = size;
			return { chunk: own, word: 0, data: this.chunks[own]! };
		}
		const open = this.#open;
		if (open < 0 || this.used[open]! + size > this.chunks[open]!.length) {
			const grown = open < 0 ? this.#first : Math.min(this.#limit, this.chunks[open]!.length * 2);
			this.#open = this.#push(Math.max(size, grown));
		}
		const chunk = this.#open;
		const word = this.used[chunk]!;
		this.used[chunk] = word + size;
		return { chunk, word, data: this.chunks[chunk]! };
	}

	#push(length: number): number {
		const { chunk, data, meta, freed } = this.#make(length);
		if (freed.length !== 0) this.#freed(freed);
		if (chunk === 0 || this.has(chunk)) throw new Error(`a built arena's new chunk came back as chunk ${chunk}, which it already holds or names none`);
		this.chunks[chunk] = data;
		this.used[chunk] = 0;
		this.#opened(chunk, data, meta);
		return chunk;
	}

	forget(chunk: number): void {
		if (this.chunks[chunk] === undefined) return;
		this.chunks[chunk] = this.#empty;
		this.used[chunk] = 0;
	}

	has(chunk: number): boolean {
		const data = this.chunks[chunk];
		return data !== undefined && data.length !== 0;
	}

	released(chunk: number): boolean {
		return this.chunks[chunk]?.length === 0;
	}

	holds(chunk: number, unit: number, length: number): boolean {
		return this.has(chunk) && unit + length <= this.used[chunk]!;
	}
}

interface CountTable {
	readonly head: Uint32Array;
	readonly bits: Uint32Array;
	readonly ranks: Uint16Array;
	readonly segments: Uint8Array[];
	ranked: number;
}

function countTable(meta: Uint8Array, words: number): CountTable {
	const blocks = Math.ceil(words / 64);
	return {
		head: new Uint32Array(meta.buffer, meta.byteOffset, 2),
		bits: new Uint32Array(meta.buffer, meta.byteOffset + 8, blocks * 2),
		ranks: new Uint16Array(meta.buffer, meta.byteOffset + 8 + blocks * 8, blocks),
		segments: [],
		ranked: 0
	};
}

function popcount(word: number): number {
	let x = word - ((word >>> 1) & 0x55555555);
	x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
	x = (x + (x >>> 4)) & 0x0f0f0f0f;
	return Math.imul(x, 0x01010101) >>> 24;
}

interface HeldTree {
	readonly tree: TreeHandle;
	readonly token: TreeToken;
	links: number;
}

const SIDE_BITS: Readonly<Record<TriviaSideName, number>> = { leading: 1, trailing: 2, inner: 4 };
const sideHolds = new WeakMap<object, Map<string, readonly TreeToken[]>>();
const NO_RECORDS = 'a side names a built record, and its engine builds no records';
const OTHER_ENGINE_RECORD = "cannot write another engine's record into a side: a side holds only records its holder's engine built";

export type BuiltWith = (node: object, name: string, args: readonly unknown[]) => unknown;

export interface BuiltViews {
	readonly withs: Readonly<Record<number, BuiltWith>>;
	readonly words: Readonly<Record<number, number>>;
	readonly cells: Readonly<Record<number, number>>;
	readonly leaves: Readonly<Record<number, LeafMaker>>;
}

export class BuiltArena {
	readonly format: CellFormat;
	readonly owner: object;
	readonly kinds: KindView;
	readonly tree: TreeHandle & Required<Pick<TreeHandle, 'triviaSide' | 'writeTriviaSide' | 'unitSides' | 'writeUnitSides'>>;
	readonly #wrap: Wrap;
	readonly #handle: TreeEngineHandle;
	readonly #views: BuiltViews;
	readonly #words: Chunks<WritableWords>;
	#drafts = new Uint32Array(DRAFT_WORDS);
	#drafted = 0;
	readonly #bytes: Chunks<Uint8Array>;
	readonly #heads: (Uint32Array | undefined)[] = [];
	readonly #tables: (CountTable | undefined)[] = [];
	readonly #cells: (Uint32Array | undefined)[] = [];
	readonly #counts: BuiltRecords['counts'];
	readonly #bump: BuiltRecords['bump'];
	readonly #release: BuiltRecords['release'];
	readonly #segmentShift: number;
	readonly #segmentMask: number;
	readonly #entries = new Map<string, BuiltText>();
	readonly #entryKeys: (string[] | undefined)[] = [];
	readonly #entryAt: (Map<number, BuiltText> | undefined)[] = [];
	readonly #links = new Map<string, { readonly at: number; readonly table: CountTable }>();
	readonly #linkKeys: (string[] | undefined)[] = [];
	readonly #trees = new Map<number, HeldTree>();
	readonly #sided: (Map<number, number> | undefined)[] = [];
	readonly #unitSided: (Set<number> | undefined)[] = [];
	readonly #leafSited: (Set<number> | undefined)[] = [];
	readonly #trivia: BuiltRecords['trivia'];
	readonly #writeLeafSites: WriteLeafSites;

	constructor({ format, owner, kinds, words, bytes, counts, bump, release, trivia }: BuiltRecords, wrap: Wrap, handle: TreeEngineHandle, views: BuiltViews, writeLeafSites: WriteLeafSites) {
		this.format = format;
		this.owner = owner;
		this.kinds = kinds;
		this.#counts = counts;
		this.#bump = bump;
		this.#release = release;
		this.#segmentShift = Math.log2(format.countSegment);
		this.#segmentMask = format.countSegment - 1;
		this.#wrap = wrap;
		this.#handle = handle;
		this.#views = views;
		this.#trivia = trivia;
		this.#writeLeafSites = writeLeafSites;
		this.tree = {
			built: this,
			triviaSide: (at, side) => {
				if (((this.#sided[chunkOf(at, format)]?.get(at) ?? 0) & SIDE_BITS[side]) === 0) return undefined;
				const entries = trivia.triviaSide(at, side);
				return entries === undefined ? undefined : readEntries(this.tree, entries);
			},
			writeTriviaSide: (at, side, entries) => {
				trivia.writeTriviaSide(at, side, entries);
				const sided = (this.#sided[chunkOf(at, format)] ??= new Map());
				sided.set(at, (sided.get(at) ?? 0) | SIDE_BITS[side]);
			},
			unitSides: (at) => (this.#unitSided[chunkOf(at, format)]?.has(at) === true ? readUnits(this.tree, trivia.unitSides(at)) : []),
			writeUnitSides: (at, units) => {
				trivia.writeUnitSides(at, units);
				(this.#unitSided[chunkOf(at, format)] ??= new Set()).add(at);
			}
		};
		bindTree(this.tree, handle);
		const freed = (chunks: readonly number[]): void => this.#sweep(chunks);
		this.#words = new Chunks(words, (chunk, data, meta) => (this.#tables[chunk] = countTable(meta, data.length)), freed, new Uint32Array(0), FIRST_CHUNK_WORDS, format);
		this.#bytes = new Chunks(
			bytes,
			(chunk, data, meta) => {
				this.#cells[chunk] = new Uint32Array(meta.buffer, meta.byteOffset, 1);
				this.#heads[chunk] = new Uint32Array(data.buffer, data.byteOffset, data.byteLength >>> 2);
			},
			freed,
			new Uint8Array(0),
			FIRST_STRING_BYTES,
			format
		);
	}

	#sweep(chunks: readonly number[]): void {
		for (const chunk of chunks) {
			for (const key of this.#entryKeys[chunk] ?? []) {
				const entry = this.#entries.get(key);
				if (entry !== undefined && chunkOf(entry.at, this.format) === chunk) this.#entries.delete(key);
			}
			for (const key of this.#linkKeys[chunk] ?? []) {
				const link = this.#links.get(key);
				if (link !== undefined && chunkOf(link.at, this.format) === chunk) this.#links.delete(key);
			}
			this.#words.forget(chunk);
			this.#bytes.forget(chunk);
			this.#tables[chunk] = undefined;
			this.#cells[chunk] = undefined;
			this.#heads[chunk] = undefined;
			this.#entryKeys[chunk] = undefined;
			this.#linkKeys[chunk] = undefined;
			this.#entryAt[chunk] = undefined;
			this.#sided[chunk] = undefined;
			this.#unitSided[chunk] = undefined;
			this.#leafSited[chunk] = undefined;
		}
	}

	get engine(): EngineIdentity {
		return this.#handle.current;
	}

	#place(size: number, count: number): BuiltPlace {
		const { chunk, word, data } = this.#words.alloc(size);
		const table = this.#tables[chunk]!;
		const ordinal = table.head[1]!;
		table.head[1] = ordinal + 1;
		table.head[0] = table.head[0]! + 1;
		const block = word >>> 6;
		while (table.ranked <= block) table.ranks[table.ranked++] = ordinal;
		table.bits[(block << 1) | ((word >>> 5) & 1)]! |= 1 << (word & 31);
		const segment = ordinal >>> this.#segmentShift;
		const counts = (table.segments[segment] ??= this.#counts(chunk, segment));
		counts[ordinal & this.#segmentMask] = count;
		return { data, base: word, at: addressOf(chunk, word, this.format), words: size };
	}

	#countAt(at: number): { readonly counts: Uint8Array; readonly index: number } {
		const chunk = chunkOf(at, this.format);
		const word = wordOf(at, this.format);
		const table = this.#tables[chunk];
		if (table === undefined || !this.#words.has(chunk)) throw new Error(releasedRecord(at));
		const block = word >>> 6;
		const bit = word & 63;
		const lo = table.bits[block << 1]!;
		const hi = table.bits[(block << 1) | 1]!;
		const starts = bit < 32 ? (lo >>> bit) & 1 : (hi >>> (bit - 32)) & 1;
		if (starts === 0) throw new Error(`no built entry starts at ${at}`);
		const ordinal = table.ranks[block]! + (bit < 32 ? popcount(lo & ((1 << bit) - 1)) : popcount(lo) + popcount(hi & ((1 << (bit - 32)) - 1)));
		const counts = table.segments[ordinal >>> this.#segmentShift];
		if (counts === undefined) throw new Error(`the built entry at ${at} has no count`);
		return { counts, index: ordinal & this.#segmentMask };
	}

	/** Holds the built entry at `at` once more: moves the count its builder's handle holds, else takes one more. */
	hold(at: number): void {
		const { counts, index } = this.#countAt(at);
		const byte = counts[index]!;
		const { countOwned, countSaturated } = this.format;
		if ((byte & countOwned) !== 0) {
			counts[index] = byte & ~countOwned;
			return;
		}
		const count = byte & countSaturated;
		if (count === 0) throw new Error(releasedRecord(at));
		if (count === countSaturated) this.#bump(at);
		else counts[index] = byte + 1;
	}

	/** Holds once more what the cell `cell` names: a record or run, or a leaf entry's string chunk. */
	holdCell(cell: number): void {
		if (cell === 0) return;
		const at = cell >>> 2;
		const chunk = chunkOf(at, this.format);
		if (chunk === 0) return;
		if (this.#words.has(chunk)) this.hold(at);
		else this.holdText(at);
	}

	/** Takes one more count of the string chunk the leaf entry at `at` lies in. */
	holdText(at: number): void {
		const cells = this.#cells[chunkOf(at, this.format)];
		if (cells === undefined || cells.length === 0) throw new Error(releasedRecord(at));
		cells[0] = cells[0]! + 1;
	}

	/** Drops the count the cell `cell` held of what it names, a run for a list's cell; the native release frees what that leaves unheld. */
	dropCell(cell: number, list: boolean): void {
		if (cell === 0) return;
		const at = cell >>> 2;
		const chunk = chunkOf(at, this.format);
		if (chunk === 0) return;
		if (!this.#words.has(chunk)) {
			const cells = this.#cells[chunk];
			if (cells === undefined || cells.length === 0) throw new Error(releasedRecord(at));
			if (cells[0]! > 1) cells[0] = cells[0]! - 1;
			else this.#released(this.#release(at, this.format.held.text, false));
			return;
		}
		this.drop(at, list ? this.format.held.run : this.format.held.record);
	}

	/** Drops one count of the entry at `at`, which `held` names the form of. */
	drop(at: number, held: number): void {
		const { counts, index } = this.#countAt(at);
		const byte = counts[index]!;
		const count = byte & this.format.countSaturated;
		if (count > 1 && count !== this.format.countSaturated) counts[index] = byte - 1;
		else this.#released(this.#release(at, held, false));
	}

	/** Releases the count the handle of the record at `at` holds, a no-op when the handle holds none. */
	release(at: number): void {
		this.#released(this.#release(at, this.format.held.record, true));
	}

	#released(trees: readonly number[]): void {
		for (const id of trees) {
			const held = this.#trees.get(id);
			if (held !== undefined && --held.links === 0) this.#trees.delete(id);
		}
	}

	#holdCells(at: number, kind: number, side: boolean): void {
		const head = wordOf(at, this.format);
		const words = this.#widthOf(kind);
		const data = this.#chunk(at, words);
		if (side) this.holdCell(data[head + 1]! * 4);
		for (let word = this.#views.cells[kind] ?? words; word < words; word++) this.holdCell(data[head + word]!);
	}

	/** The header word of a record of `kind`, its flags `flags`. */
	header(kind: number, flags = 0): number {
		return (withKind(kind, this.format.kindBits) | (flags << this.format.kindBits)) >>> 0;
	}

	/** The kind the header of the record at `at` names. */
	kindAt(at: number): number {
		return headerKind(this.words(at, 1)[wordOf(at, this.format)]!, this.format.kindBits);
	}

	record(kind: number): BuiltDraft {
		return this.draft(kind, this.#widthOf(kind));
	}

	draft(kind: number, words: number, copyOf?: number, kept?: Readonly<Record<number, unknown>>): BuiltDraft {
		if (this.#drafted + words > this.#drafts.length) {
			this.#drafts = new Uint32Array(Math.max(words, DRAFT_WORDS));
			this.#drafted = 0;
		}
		const draft: BuiltDraft = { data: this.#drafts, base: this.#drafted, words, placed: undefined, copyOf, kept, patched: undefined };
		this.#drafts[draft.base] = this.header(kind);
		this.#drafted += words;
		return draft;
	}

	copy(source: object, kind: number): BuiltDraft {
		const at = builtRecordOf(source, this);
		if (at === undefined) return this.record(kind);
		const head = wordOf(at, this.format);
		const words = this.#widthOf(kind);
		const found = this.kindAt(at);
		if (found !== kind) throw new Error(`a $with of a kind ${kind} record was handed a record of kind ${found}`);
		const draft = this.draft(kind, words, at, (source as { readonly $cache?: Readonly<Record<number, unknown>> }).$cache ?? {});
		draft.data.set(this.#chunk(at, words).subarray(head, head + words), draft.base);
		this.#holdCells(at, kind, true);
		return draft;
	}

	/** The words of a run of `length` one-word cells after its length word, which it holds. */
	run(length: number): BuiltPlace {
		const run = this.#place(length + 1, 1);
		run.data[run.base] = length;
		return run;
	}

	/** `words` written at a fresh address, `count` holding it: a side record or a link record. */
	push(words: readonly number[], count: number): number {
		const place = this.#place(words.length, count);
		place.data.set(words, place.base);
		return place.at;
	}

	/** The leaf entry of `kind` holding `text`, interned: each call with equal kind and text answers the same entry. */
	entry(kind: number, text: string): BuiltText {
		const key = `${kind}:${text}`;
		const known = this.#entries.get(key);
		if (known !== undefined && this.#live(known)) return known;
		const bytes = encoder.encode(text);
		const { kindBits } = this.format;
		if (bytes.length >= 2 ** (32 - kindBits)) throw new Error(`a built leaf's text of ${bytes.length} bytes is past what a leaf entry's length holds`);
		const size = (ENTRY_HEAD_BYTES + bytes.length + 3) & ~3;
		const target = this.#bytes.alloc(size);
		const heads = this.#heads[target.chunk]!;
		heads[target.word >>> 2] = (withKind(kind, kindBits) | (bytes.length * 2 ** kindBits)) >>> 0;
		target.data.set(bytes, target.word + ENTRY_HEAD_BYTES);
		const entry: BuiltText = { at: addressOf(target.chunk, target.word, this.format), text, data: target.data };
		this.#entries.set(key, entry);
		(this.#entryKeys[target.chunk] ??= []).push(key);
		(this.#entryAt[target.chunk] ??= new Map()).set(entry.at, entry);
		return entry;
	}

	/** The entry of `leaf`, of kind `kind`, interned at its first placement: a leaf placed before keeps its entry. */
	placeEntry(leaf: object, kind: number, entry: BuiltText): BuiltText {
		if (entry.at !== 0 && this.#live(entry)) return entry;
		const placed = this.entry(kind, entry.text ?? '');
		(leaf as { $entry: BuiltText }).$entry = placed;
		return placed;
	}

	#live(entry: BuiltText): boolean {
		const data = this.#bytes.chunks[chunkOf(entry.at, this.format)];
		return data === entry.data && data !== undefined && data.length !== 0;
	}

	/** The leaf entry at `at`: its kind, its text's length in bytes, and the entry. */
	entryAt(at: number): { readonly kind: number; readonly len: number; readonly entry: BuiltText } {
		const chunk = chunkOf(at, this.format);
		const byte = wordOf(at, this.format);
		if (this.#bytes.released(chunk)) throw new Error(releasedRecord(at));
		if (byte % ENTRY_HEAD_BYTES !== 0 || !this.#bytes.holds(chunk, byte, ENTRY_HEAD_BYTES)) throw new Error(`a built cell names no leaf entry at ${at}`);
		const head = this.#heads[chunk]![byte >>> 2]!;
		const { kindBits } = this.format;
		const kind = kindField(head, kindBits);
		const len = Math.floor(head / 2 ** kindBits);
		const known = this.#entryAt[chunk]?.get(at);
		if (known !== undefined && this.#live(known)) return { kind, len, entry: known };
		if (!this.#bytes.holds(chunk, byte + ENTRY_HEAD_BYTES, len)) throw new Error(`a built leaf entry at ${at} runs past its arena's bytes (${len} bytes)`);
		const data = this.#bytes.chunks[chunk]!;
		const entry: BuiltText = { at, text: decoder.decode(data.subarray(byte + ENTRY_HEAD_BYTES, byte + ENTRY_HEAD_BYTES + len)), data };
		(this.#entryAt[chunk] ??= new Map()).set(at, entry);
		return { kind, len, entry };
	}

	/** The text of the leaf entry `entry`. */
	entryText(entry: BuiltText): string {
		return entry.text ?? this.entryAt(entry.at).entry.text ?? '';
	}

	/** The link record naming the parsed node of `kind` at `row` of tree `tree`, interned while a cell holds it, with one more count for the cell that names it: its subtree's end, its record there (0 for none) and its byte span. A new one holds its tree. */
	link(kind: number, tree: TreeHandle & { readonly id: number }, token: TreeToken, row: number, end: number, record: number, span: { readonly start: number; readonly end: number }): number {
		const key = `${tree.id}:${row}:${kind}`;
		const known = this.#links.get(key);
		if (known !== undefined && this.#tables[chunkOf(known.at, this.format)] === known.table && this.#words.has(chunkOf(known.at, this.format)) && this.#linkHeld(known.at)) {
			this.hold(known.at);
			return known.at;
		}
		const words = [this.header(kind, this.format.linkFlag), 0, tree.id, row, end, record, span.start, span.end];
		if (words.length !== this.format.linkWords) throw new Error(`a link record takes ${this.format.linkWords} words, not ${words.length}`);
		const at = this.push(words, 1);
		this.holdTree(tree, token);
		const chunk = chunkOf(at, this.format);
		this.#links.set(key, { at, table: this.#tables[chunk]! });
		(this.#linkKeys[chunk] ??= []).push(key);
		return at;
	}

	#linkHeld(at: number): boolean {
		const { counts, index } = this.#countAt(at);
		return (counts[index]! & this.format.countSaturated) !== 0;
	}

	/** The chunk `at` lies in, `length` words from `at` of it written. */
	words(at: number, length: number): ChunkWords {
		return this.#chunk(at, length);
	}

	#chunk(at: number, length: number): WritableWords {
		const chunk = chunkOf(at, this.format);
		if (this.#words.released(chunk)) throw new Error(releasedRecord(at));
		if (!this.#words.holds(chunk, wordOf(at, this.format), length)) {
			throw new Error(`a built record read runs past its arena's words (address ${at}, ${length} words)`);
		}
		return this.#words.chunks[chunk]!;
	}

	/** Whether chunk `chunk` holds records, as against leaf entries. */
	holdsRecords(chunk: number): boolean {
		return this.#words.has(chunk);
	}

	chunks(): BuiltChunks {
		const cut = <A extends WritableWords | Uint8Array>(table: Chunks<A>): A[] =>
			table.chunks.map((chunk, n) => chunk.subarray(0, table.used[n]) as A);
		return { words: cut(this.#words), bytes: cut(this.#bytes) };
	}

	#view(at: number): object {
		const position: RecordPosition = { $type: this.kindAt(at), $tree: this.tree, $at: at, $_layout: undefined };
		return this.#wrap(position, this.tree) as object;
	}

	/** The handle of the drafted `record`, placed past every record its cells name. Each built leaf it holds is placed at its site there. */
	view(record: BuiltDraft): object {
		const place = this.#place(record.words, this.format.countOwned | 1);
		place.data.set(record.data.subarray(record.base, record.base + record.words), place.base);
		const placed = record.placed;
		for (let n = 0; placed !== undefined && n < placed.length; n += 3) this.#site(placed[n] as object, place.at, placed[n + 1] as number, placed[n + 2] as number);
		if (record.copyOf !== undefined) this.#copySites(record.copyOf, place.at, record.patched ?? []);
		return this.#view(place.at);
	}

	/** A leaf of text `text` made by `maker`, as a built leaf of this arena: it has no record, and its entry is interned when it is first placed. */
	leaf(maker: LeafMaker, text: string): object {
		return maker(this.tree, { at: 0, text }, undefined);
	}

	/**
	 * The handle of the built leaf of `kind` whose entry is at `at`, at its site in the record at `holder`.
	 *
	 * @throws For a kind no builder writes leaves of.
	 */
	leafAt(kind: number, at: number, holder: number, word: number, item: number): object {
		const maker = this.#views.leaves[kind];
		if (maker === undefined) throw new Error(`no builder writes leaves of kind ${kind}, so the arena has no leaf handle for one`);
		return maker(this.tree, this.entryAt(at).entry, packSite(holder, word, item));
	}

	#site(leaf: object, holder: number, word: number, item: number): void {
		placeLeaf(leaf, holder, word, item);
		this.#writeLeafSites(leaf, [holder, word, item]);
	}

	/** Replaces `side` of the built leaf at each site `sites` names, `[holder, word, item]` after another, with `entries`. */
	writeLeafSide(sites: readonly number[], side: TriviaSideName, entries: readonly unknown[]): void {
		this.#trivia.writeLeafSide(sites, side, entries);
		for (let n = 0; n < sites.length; n += 3) (this.#leafSited[chunkOf(sites[n]!, this.format)] ??= new Set()).add(sites[n]!);
	}

	/** The entries a write gave `side` of the built leaf at the site `holder`, `word`, `item`, `undefined` for none. */
	leafSide(holder: number, word: number, item: number, side: TriviaSideName): unknown[] | undefined {
		if (this.#leafSited[chunkOf(holder, this.format)]?.has(holder) !== true) return undefined;
		const entries = this.#trivia.leafSide(holder, word, item, side);
		return entries === undefined ? undefined : readEntries(this.tree, entries);
	}

	#copySites(from: number, to: number, skip: readonly number[]): void {
		const units = this.#unitSided[chunkOf(from, this.format)]?.has(from) === true;
		const leaves = this.#leafSited[chunkOf(from, this.format)]?.has(from) === true;
		if (!units && !leaves) return;
		this.#trivia.copySites(from, to, skip);
		const chunk = chunkOf(to, this.format);
		if (units) (this.#unitSided[chunk] ??= new Set()).add(to);
		if (leaves) (this.#leafSited[chunk] ??= new Set()).add(to);
	}

	/** The handle of the compound record at `at`. */
	node(at: number): object {
		return this.#view(at);
	}

	/** Whether the record at `at` was rebuilt from a parsed node, which its side record names. */
	rebuiltFromRead(at: number): boolean {
		const side = this.words(at, 2)[wordOf(at, this.format) + 1]!;
		return side !== 0 && (this.words(side, 1)[wordOf(side, this.format)]! & this.format.sideSides.bit) !== 0;
	}

	withOf(kind: number): BuiltWith | undefined {
		return this.#views.withs[kind];
	}

	/** Holds the parsed tree `tree`, which one more link record or side record of this arena names, with its `token`, until the release of the last of them. */
	holdTree(tree: TreeHandle & { readonly id: number }, token: TreeToken): void {
		const held = this.#trees.get(tree.id);
		if (held === undefined) this.#trees.set(tree.id, { tree, token, links: 1 });
		else held.links++;
	}

	/** The node a child cell linking the record `at` of parsed tree `tree` names: the parsed tree's own view of it. */
	linked(tree: number, at: number): object {
		const held = this.#trees.get(tree);
		if (held === undefined) throw new Error(`a built record links parsed tree ${tree}, which its arena does not hold`);
		const position = recordStub(held.tree, at);
		return wrapRegistered(position, held.tree, this.#wrap as (data: object, tree: TreeHandle) => object, rowRole(held.tree, decodeIndex(position.$_layout!.at.$treeHandle), at));
	}

	#widthOf(kind: number): number {
		const words = this.#views.words[kind];
		if (words === undefined) throw new Error(`no builder writes records of kind ${kind}, so the arena has no width for one`);
		return words;
	}

	rebuiltFrom(node: object, tree: TreeHandle & { readonly id: number }, token: TreeToken, index: number, end: number, span: { readonly start: number; readonly end: number }): object {
		const at = builtRecordOf(node, this);
		if (at === undefined) throw new Error('only a record this arena built is rebuilt from a parsed node');
		const head = wordOf(at, this.format);
		const header = this.words(at, 2);
		const kind = this.kindAt(at);
		const words = this.#widthOf(kind);
		const side = this.#sidesNaming(header[head + 1]!, [tree.id, index, end, span.start, span.end]);
		this.holdTree(tree, token);
		this.#holdCells(at, kind, false);
		const place = this.#place(words, this.format.countOwned | 1);
		place.data.set(this.#chunk(at, words).subarray(head, head + words), place.base);
		place.data[place.base + 1] = side;
		this.#copySites(at, place.at, []);
		return this.#view(place.at);
	}

	#sidesNaming(side: number, sides: readonly number[]): number {
		const { sideBeforeDelimiter, sideSides, sideDelimiter, sideSeparatorKind } = this.format;
		if (side === 0) return this.push([sideSides.bit, ...sides], 1);
		const start = wordOf(side, this.format);
		const mask = this.words(side, 1)[start]!;
		const known = sideBeforeDelimiter.reduce((bits, field) => bits | field.bit, sideDelimiter | sideSeparatorKind);
		if ((mask & ~known) !== 0) throw new Error(`a built record's side record holds fields ${mask & ~known} no builder writes`);
		let length = 1 + ((mask & sideDelimiter) === 0 ? 0 : 1) + ((mask & sideSeparatorKind) === 0 ? 0 : 1);
		let offset = 1;
		let before = true;
		for (const field of sideBeforeDelimiter) {
			if (field.bit === sideSides.bit) before = false;
			if ((mask & field.bit) === 0) continue;
			length += field.words;
			if (before) offset += field.words;
		}
		const words = Array.from(this.#chunk(side, length).subarray(start, start + length));
		words.splice(offset, (mask & sideSides.bit) === 0 ? 0 : sideSides.words, ...sides);
		words[0] = mask | sideSides.bit;
		return this.push(words, 1);
	}

	/** The parsed node a linked leaf's cell names, as its tree's own view of it. */
	linkedLeaf({ kind, tree, row, span }: { readonly kind: number; readonly tree: number; readonly row: number; readonly span: { readonly start: number; readonly end: number } }): object {
		const held = this.#trees.get(tree);
		if (held === undefined) throw new Error(`a built record holds a node of parsed tree ${tree}, which its arena does not hold`);
		const data = leafData(held.tree, kind, span, row);
		holdReadTree(data, held.token);
		return wrapRegistered(data, held.tree, this.#wrap as (data: object, tree: TreeHandle) => object, rowRole(held.tree, row, undefined));
	}
}

function rowRole(tree: TreeHandle, row: number, record: number | undefined): Role {
	return tree.records?.record(row) === record ? 'node' : 'aliasContent';
}

export interface BuiltEntry {
	readonly $type: number;
	readonly $record: number;
}

export function isBuiltEntry(entry: unknown): entry is BuiltEntry {
	return typeof entry === 'object' && entry !== null && typeof (entry as Partial<BuiltEntry>).$record === 'number';
}

export function builtEntries(entries: readonly unknown[], table: object): unknown[] {
	if (!entries.some(isBuiltEntry)) return entries as unknown[];
	return entries.map((entry) => (isBuiltEntry(entry) ? builtEntryNode(entry, table) : entry));
}

export function readEntries(table: object, entries: readonly unknown[], own?: TreeToken): unknown[] {
	for (const entry of entries) {
		if (isCoordinate(entry)) readCoordinate(table, entry, own);
		else if (own !== undefined && !isBuiltEntry(entry)) holdReadTree(entry, own);
	}
	return builtEntries(entries, table);
}

export function readCoordinate(table: object, coordinate: NodeCoordinate, own?: TreeToken): NodeCoordinate {
	const token = heldTree(table, decodeTree(coordinate.$treeHandle), own);
	if (token !== undefined) holdReadTree(coordinate, token);
	return coordinate;
}

export function readUnits(table: object, units: readonly unknown[], own?: TreeToken): unknown[] {
	return units.map((unit) => ({ ...(unit as object), ...mapTriviaEntries(unit as TriviaSides<unknown>, (entries) => readEntries(table, entries, own)) }));
}

function heldTree(table: object, treeId: number, own: TreeToken | undefined): TreeToken | undefined {
	if (own?.treeId === treeId) return own;
	for (const trees of sideHolds.get(table)?.values() ?? []) {
		const token = trees.find((tree) => tree.treeId === treeId);
		if (token !== undefined) return token;
	}
	return undefined;
}

export function builtEntryNode(entry: BuiltEntry, table: object): object {
	const arena = treeBuiltArena(table);
	if (arena === undefined) throw new Error(NO_RECORDS);
	return arena.node(entry.$record);
}

function recordRefOf(entry: unknown): BuiltRecordRef | undefined {
	const built = typeof entry === 'object' && entry !== null ? builtRefOf(entry) : undefined;
	return built?.at === undefined ? undefined : built;
}

export function sideEntryOf(entry: object, arena: BuiltArena | undefined, holder: EngineIdentity | undefined): BuiltEntry | NodeCoordinate | undefined {
	refuseForeignEntry(entry, holder);
	if (arena === undefined && isBuiltNode(entry)) throw new Error(NO_RECORDS);
	const built = recordRefOf(entry);
	if (built === undefined) return readCoordinateOf(entry);
	if (built.arena !== arena) throw new Error(OTHER_ENGINE_RECORD);
	return { $type: (entry as { readonly $type: number }).$type, $record: built.at };
}

export function refuseForeignEntry(entry: object, holder: EngineIdentity | undefined): void {
	const engine = builtRefOf(entry)?.arena.engine ?? engineOf(entry);
	if (engine === undefined || holder === undefined || sameLanguage(engine, holder)) return;
	throw new Error(`cannot write a ${engine.language.name} ${isBuiltNode(entry) ? 'record' : 'node'} into a side of a ${holder.language.name} node`);
}

function readCoordinateOf(entry: object): NodeCoordinate | undefined {
	return isRead(entry) && !isRebuilt(entry) ? coordinateOf(entry) : undefined;
}

export function refuseBuiltEntries(trivia: TriviaSides<unknown>): void {
	forEachTriviaList(trivia, (entries) => {
		if (entries.some((entry) => typeof entry === 'object' && entry !== null && isBuiltNode(entry))) throw new Error(NO_RECORDS);
	});
}

export function holdSideEntries(table: object, place: string, entries: readonly unknown[]): void {
	const trees = new Set<TreeToken>();
	for (const entry of entries) {
		if (typeof entry !== 'object' || entry === null) continue;
		const tree = readCoordinateOf(entry) === undefined ? undefined : treeTokenOf(entry);
		if (tree !== undefined) trees.add(tree);
	}
	let held = sideHolds.get(table);
	if (held === undefined) sideHolds.set(table, (held = new Map()));
	if (trees.size === 0) held.delete(place);
	else held.set(place, [...trees]);
}

export function isBuiltNode(value: object): boolean {
	return builtRefOf(value) !== undefined;
}

export function builtArenaOf(value: object): BuiltArena | undefined {
	return builtRefOf(value)?.arena;
}

export function builtRecordOf(value: object, arena: BuiltArena): number | undefined {
	const ref = builtRefOf(value);
	return ref?.arena === arena ? ref.at : undefined;
}

function changedWord(changed: ChangedEdges): number {
	return (changed.leading ? 1 : 0) | (changed.trailing ? 2 : 0);
}

/** The built cell naming `at`, a record or a leaf entry, with the edges `changed` its site marks. */
export function builtCell(at: number, changed = 0): number {
	if (at >= 2 ** 30) throw new Error(`a built cell holds addresses below 2^30, not ${at}`);
	return at * 4 + changed;
}

/** The built cell of a unit of `kind`: an address in chunk 0, whose word is the kind. */
export function unitCell(kind: number, format: CellFormat): number {
	if (kind >= 2 ** format.chunkShift) throw new Error(`a unit cell holds kinds below ${2 ** format.chunkShift}, not ${kind}`);
	return kind * 4;
}

/**
 * The built cell `word` decoded: absent for 0; a unit for an address in chunk 0; in a word chunk, a record, or through a
 * link record a parsed node's record or, with none, the parsed node itself; in a string chunk, a leaf entry, captured
 * text for the blank kind.
 *
 * @throws For words no builder writes.
 */
export function decodeBuiltCell(arena: BuiltArena, word: number): RecordCell {
	if (word === 0) return { form: 'absent' };
	const edges = word & 3;
	const changed = { leading: (edges & 1) !== 0, trailing: (edges & 2) !== 0 };
	const at = word >>> 2;
	const chunk = chunkOf(at, arena.format);
	if (chunk === 0) {
		if (edges !== 0) throw new Error(`a unit cell ${word} marks changed edges`);
		return { form: 'unit', kind: wordOf(at, arena.format), row: undefined };
	}
	const { kindBits, linkFlag, linkWords } = arena.format;
	if (arena.holdsRecords(chunk)) {
		const words = arena.words(at, 1);
		const start = wordOf(at, arena.format);
		const head = words[start]!;
		const kind = kindField(head, kindBits);
		const flags = head >>> kindBits;
		if (flags === 0) return { form: 'child', kind, at, link: undefined, changed };
		if (flags !== linkFlag) throw new Error(`a built record header holds flags ${flags}, which no builder writes`);
		const link = arena.words(at, linkWords);
		const record = link[start + 5]!;
		const tree = link[start + 2]!;
		if (record !== 0) return { form: 'child', kind, at: record, link: tree, changed };
		return { form: 'linkedLeaf', kind, at, tree, row: link[start + 3]!, end: link[start + 4]!, span: { start: link[start + 6]!, end: link[start + 7]! }, changed };
	}
	const { kind, len } = arena.entryAt(at);
	if (kind === 0) return { form: 'builtText', offset: at, len };
	return { form: 'builtLeaf', kind, offset: at, len, changed };
}

/** Writes the cell at `cell` of the drafted `record`, its slot `word`, holding `value`. */
export function storeCell(arena: BuiltArena, record: BuiltDraft, cell: number, word: number, value: unknown): void {
	record.data[record.base + cell] = cellOf(arena, value, record, word, 0, NO_EDGES);
}

function cellOf(arena: BuiltArena, value: unknown, record: BuiltDraft, word: number, item: number, changed: ChangedEdges): number {
	if (value === undefined || value === null) return 0;
	if (typeof value === 'number') return unitCell(value, arena.format);
	if (typeof value === 'string') {
		const entry = arena.entry(0, value);
		arena.holdText(entry.at);
		return builtCell(entry.at);
	}
	const ref = builtRefOf(value);
	if (ref === undefined && typeof value === 'object') return parsedCell(arena, value, changed);
	if (ref === undefined || ref.arena !== arena) throw new Error(`a built record holds only nodes its own engine built, not ${foreignValue(value, ref)}`);
	if (ref.at !== undefined) {
		arena.hold(ref.at);
		return builtCell(ref.at, changedWord(changed));
	}
	const entry = arena.placeEntry(value as object, (value as { readonly $type: number }).$type, ref.text);
	arena.holdText(entry.at);
	(record.placed ??= []).push(value, word, item);
	return builtCell(entry.at, changedWord(changed));
}

/** Sets the presence bits `mask` of the word at `at` of a fresh record. */
export function storeFlag(data: WritableWords, at: number, mask: number): void {
	data[at] = (data[at]! | mask) >>> 0;
}

/**
 * The cell of a slot holding the untouched parsed node `value`: its link record, which names its tree, its row and
 * span, and its record there when it has one. The arena holds the tree from then on.
 *
 * @throws For a node no read produced, or one read through an engine that does not read trees as records.
 */
function parsedCell(arena: BuiltArena, value: object, changed: ChangedEdges): number {
	const coordinate = isCoordinate(value) ? value : coordinateOf(value);
	const token = treeTokenOf(value);
	const tree = coordinate === undefined ? undefined : treeOf(value);
	if (coordinate === undefined || token === undefined || tree?.records === undefined || tree.id === undefined) {
		throw new Error(`a built record holds only nodes its own engine built or a record tree read, not ${foreignValue(value, undefined)}`);
	}
	const own = (value as { readonly $type?: unknown }).$type;
	const kind = typeof own === 'number' ? own : coordinate.$type;
	if (kind === undefined) throw new Error('a built record cannot name a parsed node whose coordinate stamps no kind');
	const index = decodeIndex(coordinate.$treeHandle);
	const record = recordOf(value) ?? rowRecordOf(tree.records, index, kind) ?? 0;
	return builtCell(arena.link(kind, tree as TreeHandle & { readonly id: number }, token, index, coordinate.$end, record, coordinate.$span), changedWord(changed));
}

function rowRecordOf(records: RecordReader, index: number, kind: number): number | undefined {
	const record = records.record(index);
	return record !== undefined && records.words(record, 1)[wordOf(record, records.format)] === kind ? record : undefined;
}

function foreignValue(value: unknown, ref: BuiltRef | undefined): string {
	if (ref !== undefined) return `a node of kind ${(value as { readonly $type?: unknown }).$type} another engine built`;
	if (typeof value !== 'object' || value === null) return `a ${typeof value}`;
	const kind = (value as { readonly $type?: unknown }).$type;
	if (typeof kind !== 'number') return `an object with keys ${Object.keys(value).slice(0, 6).join(', ')}`;
	if (coordinateOf(value) !== undefined || isRead(value)) return `a node of kind ${kind} read from a tree`;
	return `an object node of kind ${kind}`;
}

/** Writes the list cell at `cell` of the drafted `record`, its slot `word`: a run of `items.length` one-word cells after their number. */
export function storeList(arena: BuiltArena, record: BuiltDraft, cell: number, word: number, items: readonly unknown[]): void {
	if (items.length === 0) return;
	const run = arena.run(items.length);
	for (let n = 0; n < items.length; n++) run.data[run.base + 1 + n] = cellOf(arena, items[n], record, word, n, changedEdges(items, n, arena.kinds));
	record.data[record.base + cell] = builtCell(run.at);
}

export function storeListOptions(arena: BuiltArena, record: BuiltDraft, delimiter: number | undefined, separator: number | undefined): void {
	if (delimiter === undefined && separator === undefined) return;
	const side = [0];
	if (delimiter !== undefined) {
		side[0]! |= arena.format.sideDelimiter;
		side.push(delimiter);
	}
	if (separator !== undefined) {
		side[0]! |= arena.format.sideSeparatorKind;
		side.push(separator);
	}
	record.data[record.base + 1] = arena.push(side, 1);
}

function keptAt(record: BuiltDraft, word: number, value: unknown): boolean {
	const kept = record.kept;
	return kept !== undefined && word in kept && kept[word] === value;
}

function patchedAt(arena: BuiltArena, record: BuiltDraft, cell: number, word: number, list: boolean): void {
	arena.dropCell(record.data[record.base + cell]!, list);
	record.data[record.base + cell] = 0;
	(record.patched ??= []).push(word);
}

export function patchCell(arena: BuiltArena, record: BuiltDraft, cell: number, word: number, value: unknown): void {
	if (keptAt(record, word, value)) return;
	patchedAt(arena, record, cell, word, false);
	storeCell(arena, record, cell, word, value);
}

export function patchList(arena: BuiltArena, record: BuiltDraft, cell: number, word: number, items: readonly unknown[]): void {
	const kept = record.kept?.[word];
	if (Array.isArray(kept) && kept.length === items.length && items.every((item, n) => item === kept[n])) return;
	patchedAt(arena, record, cell, word, true);
	storeList(arena, record, cell, word, items);
}

export function patchFlag(record: BuiltDraft, word: number, mask: number, on: unknown): void {
	const at = record.base + word;
	record.data[at] = on ? (record.data[at]! | mask) >>> 0 : (record.data[at]! & ~mask) >>> 0;
}

export function patchListOptions(arena: BuiltArena, record: BuiltDraft, delimiter: number | undefined, separator: number | undefined): void {
	if (record.copyOf !== undefined) {
		const source: RecordPosition = { $type: arena.kindAt(record.copyOf), $tree: arena.tree, $at: record.copyOf, $_layout: undefined };
		if (delimiter === recordDelimiter(source) && separator === recordSeparator(source)) return;
	}
	const side = record.data[record.base + 1]!;
	if (side !== 0) arena.drop(side, arena.format.held.side);
	record.data[record.base + 1] = 0;
	storeListOptions(arena, record, delimiter, separator);
}
