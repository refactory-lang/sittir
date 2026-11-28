import type { ByteSpan, CommitScope, EngineIdentity, NodeCoordinate, NodeTrivia, ParseOptions, UnitSidesWire, WireNode } from '@sittir/types';
import { bindTree, engineOf, isLive, sameLanguage, treeBuiltArena, type TreeEngineHandle } from './engine-scope.ts';
import { wrapRegistered } from './identity.ts';
import { asReadOutput, coordinateIndex, coordinateOf, holdReadCoordinate, holdReadTree, isRead, type KindView, keyName, type ReadOutput, triviaOf, unpackedSite } from './node-data.ts';
import { decodeTree, isCoordinate } from './read.ts';
import { carryTree, mintTreeToken, registerTree, treeOf, treeTokenOf, type TreeToken } from './tree-token.ts';
import type { ChunkWords, TreeHandle, TriviaSideName } from './read.ts';
import type { TreeQuery } from './query.ts';
import { BLANK_KIND_ID } from './blank-arm.ts';
import { checkedKindId } from './kind-id.ts';
import { addressOf, chunkOf, decodeListCell, decodeParsedCell, decodeSideRows, decodeSideSource, headerGapKinds, headerKind, headerOf, kindField, leafItemPastNames, sideUnderRows, siteKey, siteOfKey, withKind, wordOf, type CellFormat, type CellSite, type SideRows, type RecordCell } from './record-cell.ts';
import { ERROR_KIND_ID } from './error-kind.ts';
import { builtLeafOf, builtRefOf, handleArenaOf, leafSitesOf, liveRecordAt, moveLeafSite, packSite, placeLeaf, type BuiltRecordRef, type BuiltRef } from './built-ref.ts';
import { cacheOf, freedRecord, recordDelimiter, recordFlag, recordSeparator, recordSlot, recordSlots, readLeaf, readPosition } from './record-view.ts';
import { isParsedPosition, isRecordPosition, type LeafMaker, type RecordHandle, type RecordPosition } from './handle.ts';
import { keepExemplar } from './exemplars.ts';
import { forEachTriviaList, mapTriviaEntries, type TriviaSides } from './trivia.ts';
import { Source } from './source.ts';
import { sourceOf } from './source-stamp.ts';

/** A leaf entry of a built arena: its packed address in a string chunk, 0 before its leaf is first placed, its kind once placed, its text, and the chunk it lies in. */
export interface BuiltText {
	readonly at: number;
	readonly kind?: number;
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

export interface BuiltDraft extends BuiltPlace {
	placed: unknown[] | undefined;
	readonly copyOf: number | undefined;
	readonly copyOfParsed: RecordPosition | undefined;
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
	readonly sealed?: { readonly chunk: number; readonly meta: Uint8Array };
}

export interface BuiltRecords {
	readonly format: CellFormat;
	readonly owner: object;
	readonly kinds: KindView;
	words(length: number): BuiltChunk<WritableWords>;
	bytes(least: number): BuiltChunk<Uint8Array>;
	bump(at: number): void;
	release(at: number, held: number): void;
	cross(): void;
	read(chunk: number): ReadChunk | undefined;
	parse(source: string, options?: ParseOptions): ParsedRecords;
	unitSpan(key: number): ByteSpan;
	readonly query: TreeQuery;
	readonly reads: ReadNodes;
}

interface CountAt {
	readonly counts: Uint8Array;
	readonly index: number;
}

export type ReadChunk = { readonly data: WritableWords; readonly meta: Uint8Array } | { readonly bytes: Uint8Array; readonly meta: Uint8Array };

export type ReadNodes = Required<Pick<TreeHandle, 'snapshotLayouts' | 'slotLayouts' | 'slotSeparator' | 'isEmpty'>>;

export interface ParsedRecords {
	readonly root: number | null;
	readonly source: number;
	readonly errors: readonly unknown[];
}

export type WriteLeafSites = (leaf: object, sites: readonly number[]) => void;

const FIRST_CHUNK_WORDS = 1 << 10;
const ENTRY_HEAD_BYTES = 4;
const STRINGS_WRITTEN_WORD = 1;
const DEFERRED_PRUNE = 256;

interface CommitMark {
	readonly id: number;
	readonly minted: number;
	readonly parked: number;
	readonly kept: Set<unknown>;
	closed: boolean;
}
const releasedRecord = (at: number): string => `the built node at ${at} was released: its record holds no count`;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

interface ReplacedRange {
	readonly node: number;
	readonly site: number;
	readonly side: number;
	readonly offset: number;
	readonly row: number;
}

function byteWord(bytes: Uint8Array, at: number): number {
	return (bytes[at]! | (bytes[at + 1]! << 8) | (bytes[at + 2]! << 16) | (bytes[at + 3]! << 24)) >>> 0;
}

function units(size: number, least: number): void {
	if (!Number.isSafeInteger(size) || size < least) throw new Error(`a built arena cannot allocate ${size} units`);
}

function encodedInto(text: string, data: Uint8Array, at: number): number | undefined {
	if (at > data.length) return undefined;
	const { read, written } = encoder.encodeInto(text, data.subarray(at));
	return read === text.length && ((at + written + 3) & ~3) <= data.length ? written : undefined;
}

interface Marks {
	at(chunk: number): number;
	set(chunk: number, at: number): void;
	reset(chunk: number): void;
}

function ownMarks(): Marks {
	const used: number[] = [];
	return {
		at: (chunk) => used[chunk] ?? 0,
		set: (chunk, at) => void (used[chunk] = at),
		reset: (chunk) => void (used[chunk] = 0)
	};
}

class Chunks<A extends WritableWords | Uint8Array> {
	readonly #make: (length: number) => BuiltChunk<A>;
	readonly #opened: (chunk: number, data: A, meta: Uint8Array) => void;
	readonly #freed: (chunks: readonly number[]) => void;
	readonly #sealed: ((chunk: number, meta: Uint8Array) => void) | undefined;
	readonly #empty: A;
	readonly #first: number | undefined;
	readonly #limit: number;
	readonly #marks: Marks;
	readonly chunks: A[] = [];
	#open = -1;

	constructor(
		make: (length: number) => BuiltChunk<A>,
		opened: (chunk: number, data: A, meta: Uint8Array) => void,
		freed: (chunks: readonly number[]) => void,
		empty: A,
		sizing: { readonly first: number } | { readonly marks: Marks },
		format: CellFormat,
		sealed?: (chunk: number, meta: Uint8Array) => void
	) {
		this.#make = make;
		this.#opened = opened;
		this.#freed = freed;
		this.#sealed = sealed;
		this.#empty = empty;
		this.#limit = 2 ** format.chunkShift;
		this.#first = 'first' in sizing ? Math.min(sizing.first, this.#limit) : undefined;
		this.#marks = 'marks' in sizing ? sizing.marks : ownMarks();
	}

	written(chunk: number): number {
		return this.#marks.at(chunk);
	}

	tail(): { readonly chunk: number; readonly word: number; readonly data: A } | undefined {
		const open = this.#open;
		return open < 0 || !this.has(open) ? undefined : { chunk: open, word: this.#marks.at(open), data: this.chunks[open]! };
	}

	claimTail(size: number): { readonly chunk: number; readonly word: number; readonly data: A } {
		units(size, 0);
		if (this.tail() === undefined) throw new Error(`a built arena has no open chunk to claim ${size} units of`);
		return this.#claim(this.#open, size);
	}

	alloc(size: number): { readonly chunk: number; readonly word: number; readonly data: A } {
		units(size, 0);
		if (size > this.#limit) return this.#claim(this.#push(size), size);
		const open = this.#open;
		if (open < 0 || this.#marks.at(open) + size > this.chunks[open]!.length) {
			const first = this.#first;
			this.#open = this.#push(first === undefined ? size : Math.max(size, open < 0 ? first : Math.min(this.#limit, this.chunks[open]!.length * 2)));
		}
		return this.#claim(this.#open, size);
	}

	#claim(chunk: number, size: number): { readonly chunk: number; readonly word: number; readonly data: A } {
		const word = this.#marks.at(chunk);
		const data = this.chunks[chunk]!;
		if (word + size > data.length) throw new Error(`a built arena's chunk ${chunk} came back with ${data.length - word} units of room, short of ${size}`);
		this.#marks.set(chunk, word + size);
		return { chunk, word, data };
	}

	#push(length: number): number {
		const { chunk, data, meta, freed, sealed } = this.#make(length);
		if (freed.length !== 0) this.#freed(freed);
		if (sealed !== undefined) this.#sealed?.(sealed.chunk, sealed.meta);
		if (chunk === 0 || this.has(chunk)) throw new Error(`a built arena's new chunk came back as chunk ${chunk}, which it already holds or names none`);
		this.chunks[chunk] = data;
		this.#marks.reset(chunk);
		this.#opened(chunk, data, meta);
		return chunk;
	}

	forget(chunk: number): void {
		if (this.chunks[chunk] === undefined) return;
		this.chunks[chunk] = this.#empty;
		this.#marks.reset(chunk);
	}

	vacate(chunk: number): void {
		if (this.released(chunk)) delete this.chunks[chunk];
	}

	has(chunk: number): boolean {
		const data = this.chunks[chunk];
		return data !== undefined && data.length !== 0;
	}

	current(chunk: number, data: unknown): boolean {
		return this.chunks[chunk] === data && this.has(chunk);
	}

	released(chunk: number): boolean {
		return this.chunks[chunk]?.length === 0;
	}

	holds(chunk: number, unit: number, length: number): boolean {
		return this.has(chunk) && unit + length <= this.#marks.at(chunk);
	}
}

interface CountTable {
	head: Uint32Array;
	bits: Uint32Array;
	ranks: Uint16Array;
	counts: Uint8Array;
	ranked: number;
}

function countViews(meta: Uint8Array, words: number): Omit<CountTable, 'ranked'> {
	const blocks = Math.ceil(words / 64);
	const counts = 8 + blocks * 8 + Math.ceil(blocks / 2) * 4;
	return {
		head: new Uint32Array(meta.buffer, meta.byteOffset, 2),
		bits: new Uint32Array(meta.buffer, meta.byteOffset + 8, blocks * 2),
		ranks: new Uint16Array(meta.buffer, meta.byteOffset + 8 + blocks * 8, blocks),
		counts: new Uint8Array(meta.buffer, meta.byteOffset + counts, meta.byteLength - counts)
	};
}

function popcount(word: number): number {
	let x = word - ((word >>> 1) & 0x55555555);
	x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
	x = (x + (x >>> 4)) & 0x0f0f0f0f;
	return Math.imul(x, 0x01010101) >>> 24;
}

const sideHolds = new WeakMap<object, Map<string, readonly TreeToken[]>>();
const NO_ERRORS: readonly unknown[] = Object.freeze([]);
const NO_RECORDS = 'a side names a built record, and its engine builds no records';
const OTHER_ENGINE_RECORD = "cannot write another engine's record into a side: a side holds only records its holder's engine built";

export type BuiltWith = (node: object, name: string, args: readonly unknown[]) => unknown;

export type BuiltPlaceRow =
	| readonly [word: number, bit: number]
	| readonly [side: 'side', delimiter: boolean, separator: boolean]
	| readonly [word: number, built: number, width: number, forms: number, run: number, storageKey: string];

export interface BuiltViews {
	readonly withs: Readonly<Record<number, BuiltWith>>;
	readonly words: Readonly<Record<number, number>>;
	readonly cells: Readonly<Record<number, number>>;
	readonly places: Readonly<Record<number, readonly BuiltPlaceRow[]>>;
	readonly leaves: Readonly<Record<number, LeafMaker>>;
}

export class BuiltArena {
	readonly format: CellFormat;
	readonly owner: object;
	readonly kinds: KindView;
	readonly tree: TreeHandle & Required<Pick<TreeHandle, 'triviaSide' | 'writeTriviaSide' | 'unitSides' | 'writeUnitSides'>>;
	readonly token: TreeToken;
	readonly #wrap: Wrap;
	readonly #rootsWithoutView = new WeakMap<object, number>();
	readonly #handle: TreeEngineHandle;
	readonly #views: BuiltViews;
	readonly #words: Chunks<WritableWords>;
	readonly #bytes: Chunks<Uint8Array>;
	readonly #heads: (Uint32Array | undefined)[] = [];
	readonly #tables: (CountTable | undefined)[] = [];
	readonly #cells: (Uint32Array | undefined)[] = [];
	readonly #bump: BuiltRecords['bump'];
	readonly #release: BuiltRecords['release'];
	readonly #cross: BuiltRecords['cross'];
	#releasing = false;
	readonly #read: BuiltRecords['read'];
	readonly #parse: BuiltRecords['parse'];
	readonly #reads: (WritableWords | Uint8Array | undefined)[] = [];
	readonly #roots = new Map<number, number>();
	readonly #errors = new Map<number, readonly unknown[]>();
	readonly #entries: (Map<string, BuiltText> | undefined)[] = [];
	readonly #entryAt: (Map<number, BuiltText> | undefined)[] = [];
	readonly #sourceTexts: (Map<number, string | null> | undefined)[] = [];
	readonly #unitSpan: BuiltRecords['unitSpan'];
	readonly #writeLeafSites: WriteLeafSites;
	readonly #parkedBy = new WeakMap<object, object>();
	readonly #exemplars: object[] = [];
	readonly #siteAlive = (holder: number): boolean => this.#words.has(chunkOf(holder, this.format)) && this.#linkHeld(holder);
	#placedLast: { readonly node: object; readonly placed: readonly unknown[] } | undefined;
	readonly #minted: number[] = [];
	readonly #mintedWords: (WritableWords | undefined)[] = [];
	#mintedCount = 0;
	readonly #parked: object[] = [];
	readonly #commits: CommitMark[] = [];
	#commitCount = 0;
	readonly #moved: number[] = [];
	#movedCount = 0;
	readonly #undos: ((() => void) | undefined)[] = [];
	#undosCount = 0;
	readonly #deferred: (Map<number, () => void> | undefined)[] = [];
	#deferredCount = 0;
	#pruneAt = DEFERRED_PRUNE;
	#scopes = 0;

	constructor({ format, owner, kinds, words, bytes, bump, release, cross, read, parse, unitSpan, query, reads }: BuiltRecords, wrap: Wrap, handle: TreeEngineHandle, views: BuiltViews, writeLeafSites: WriteLeafSites) {
		this.format = format;
		this.owner = owner;
		this.kinds = kinds;
		this.#bump = bump;
		this.#release = (at, held) => {
			this.#releasing = true;
			release(at, held);
		};
		this.#cross = cross;
		this.#read = read;
		this.#parse = parse;
		this.#wrap = wrap;
		this.#handle = handle;
		this.#views = views;
		this.#unitSpan = unitSpan;
		this.#writeLeafSites = writeLeafSites;
		this.token = mintTreeToken(0);
		this.tree = {
			built: this,
			token: this.token,
			query,
			snapshotLayouts: reads.snapshotLayouts,
			slotLayouts: reads.slotLayouts,
			slotSeparator: reads.slotSeparator,
			isEmpty: reads.isEmpty,
			triviaSide: (at, side) => {
				if (at < 0 || this.reads(at)) return readEntries(this.tree, this.readSide(at, side));
				const entries = this.#ownSide(at, side);
				return entries === undefined ? undefined : readEntries(this.tree, entries);
			},
			writeTriviaSide: (at, side, entries) => this.writeSide(at, side, entries),
			unitSides: (at) => {
				if (at < 0) return readUnits(this.tree, this.readUnitSides(at));
				this.settle(at);
				return readUnits(this.tree, this.reads(at) ? this.readUnitSides(at) : this.#ownUnits(at));
			},
			writeUnitSides: (at, units) => {
				this.#undefer(at);
				this.writeUnitSides(at, units);
			}
		};
		registerTree(this.token, this.tree);
		bindTree(this.tree, handle);
		const freed = (chunks: readonly number[]): void => this.#sweep(chunks);
		this.#words = new Chunks(
			words,
			(chunk, data, meta) => (this.#tables[chunk] = { ...countViews(meta, data.length), ranked: 0 }),
			freed,
			new Uint32Array(0),
			{ first: FIRST_CHUNK_WORDS },
			format,
			(chunk, meta) => Object.assign(this.#tables[chunk]!, countViews(meta, this.#words.chunks[chunk]!.length))
		);
		this.#bytes = new Chunks(
			bytes,
			(chunk, data, meta) => {
				this.#cells[chunk] = new Uint32Array(meta.buffer, meta.byteOffset, STRINGS_WRITTEN_WORD + 1);
				this.#heads[chunk] = new Uint32Array(data.buffer, data.byteOffset, data.byteLength >>> 2);
			},
			freed,
			new Uint8Array(0),
			{
				marks: {
					at: (chunk) => this.#cells[chunk]?.[STRINGS_WRITTEN_WORD] ?? 0,
					set: (chunk, at) => void (this.#cells[chunk]![STRINGS_WRITTEN_WORD] = at),
					reset: () => undefined
				}
			},
			format
		);
	}

	#sweep(chunks: readonly number[]): void {
		for (const chunk of chunks) {
			for (const entry of this.#entryAt[chunk]?.values() ?? []) {
				const texts = entry.kind === undefined ? undefined : this.#entries[entry.kind];
				if (entry.text !== undefined && texts?.get(entry.text) === entry) texts.delete(entry.text);
			}
			this.#words.forget(chunk);
			this.#bytes.forget(chunk);
			this.#tables[chunk] = undefined;
			this.#cells[chunk] = undefined;
			this.#heads[chunk] = undefined;
			this.#entryAt[chunk] = undefined;
			this.#sourceTexts[chunk] = undefined;
			this.#deferredCount -= this.#deferred[chunk]?.size ?? 0;
			this.#deferred[chunk] = undefined;
		}
	}

	defer(at: number, work: () => void): void {
		const deferred = (this.#deferred[chunkOf(at, this.format)] ??= new Map());
		const earlier = deferred.get(at);
		if (earlier === undefined) this.#deferredCount++;
		deferred.set(
			at,
			earlier === undefined
				? work
				: () => {
						earlier();
						work();
					}
		);
		if (this.#deferredCount >= this.#pruneAt) this.#prune();
	}

	settle(at?: number): void {
		if (this.#deferredCount === 0) return;
		if (at !== undefined) {
			const work = this.#undefer(at);
			if (work !== undefined && this.#siteAlive(at)) work();
			return;
		}
		for (let chunk = 0; chunk < this.#deferred.length; chunk++) {
			const deferred = this.#deferred[chunk];
			if (deferred === undefined) continue;
			this.#deferred[chunk] = undefined;
			this.#deferredCount -= deferred.size;
			for (const [held, work] of deferred) if (this.#siteAlive(held)) work();
		}
	}

	#undefer(at: number): (() => void) | undefined {
		const deferred = this.#deferred[chunkOf(at, this.format)];
		const work = deferred?.get(at);
		if (work === undefined) return undefined;
		deferred!.delete(at);
		this.#deferredCount--;
		return work;
	}

	#prune(): void {
		for (const deferred of this.#deferred) {
			if (deferred === undefined) continue;
			for (const held of deferred.keys()) {
				if (this.#siteAlive(held)) continue;
				deferred.delete(held);
				this.#deferredCount--;
			}
		}
		this.#pruneAt = Math.max(DEFERRED_PRUNE, 2 * this.#deferredCount);
	}

	engine(): EngineIdentity {
		return this.#handle.current;
	}

	#place(size: number, count: number): BuiltPlace {
		const { chunk, word, data } = this.#words.alloc(size);
		const table = this.#tables[chunk]!;
		const ordinal = table.head[1]!;
		if (ordinal >= table.counts.length) throw new Error(`a built chunk holds ${table.counts.length} entries, so it has no count for entry ${ordinal}`);
		table.head[1] = ordinal + 1;
		table.head[0] = table.head[0]! + 1;
		const block = word >>> 6;
		while (table.ranked <= block) table.ranks[table.ranked++] = ordinal;
		table.bits[(block << 1) | ((word >>> 5) & 1)]! |= 1 << (word & 31);
		table.counts[ordinal] = count;
		return { data, base: word, at: addressOf(chunk, word, this.format), words: size };
	}

	#mint(size: number): BuiltPlace {
		const place = this.#place(size, this.format.countOwned | 1);
		if (this.#scopes > 0 || this.#commits.length > 0) this.#recordMinted(place.at, place.data);
		return place;
	}

	#recordMinted(at: number, words: WritableWords): void {
		this.#minted[this.#mintedCount] = at;
		this.#mintedWords[this.#mintedCount++] = words;
	}

	scope<T>(build: () => T): T {
		const minted = this.#mintedCount;
		const moved = this.#movedCount;
		const undos = this.#undosCount;
		this.#scopes++;
		try {
			return build();
		} catch (error) {
			this.#abandon(minted, moved, undos);
			throw error;
		} finally {
			if (--this.#scopes === 0) {
				if (this.#commits.length === 0) this.#forgetMinted(0);
				this.#movedCount = 0;
				this.#forgetUndos(0);
			}
		}
	}

	#abandon(minted: number, moved: number, undos: number): void {
		for (let n = this.#undosCount - 1; n >= undos; n--) this.#undos[n]!();
		for (let n = this.#movedCount - 1; n >= moved; n--) this.#giveBack(this.#moved[n]!);
		for (let n = this.#mintedCount - 1; n >= minted; n--) this.release(this.#minted[n]!);
		this.#movedCount = moved;
		this.#forgetUndos(undos);
		this.#forgetMinted(minted);
	}

	#forgetMinted(from: number): void {
		for (let n = from; n < this.#mintedCount; n++) this.#mintedWords[n] = undefined;
		this.#mintedCount = from;
	}

	#forgetUndos(from: number): void {
		for (let n = from; n < this.#undosCount; n++) this.#undos[n] = undefined;
		this.#undosCount = from;
	}

	attempt<T>(build: () => T): T {
		if (this.#scopes > 0) throw new Error('a build callback (render or create) called while a build is running: call it before or after the build');
		const mark = this.#open();
		let built: T;
		try {
			built = build();
		} catch (error) {
			this.#settle(mark, false);
			throw error;
		}
		this.#settle(mark, true);
		return built;
	}

	#settle(mark: CommitMark, keepAll: boolean): void {
		for (let top = this.#commits.at(-1); top !== undefined && top !== mark; top = this.#commits.at(-1)) this.#close(top, false);
		this.#close(mark, keepAll);
	}

	#open(): CommitMark {
		const mark: CommitMark = { id: ++this.#commitCount, minted: this.#mintedCount, parked: this.#parked.length, kept: new Set(), closed: false };
		this.#commits.push(mark);
		return mark;
	}

	commit(): CommitScope {
		if (this.#scopes > 0) throw new Error('engine.scope() called while a build is running: open the scope before the build');
		const mark = this.#open();
		return {
			keep: <N extends object>(node: N): N => this.#keep(mark, node),
			[Symbol.dispose]: () => this.#close(mark, false)
		};
	}

	#keep<N extends object>(mark: CommitMark, node: N): N {
		if (mark.closed || !isLive(this.#handle.current)) throw new Error(`keep: commit scope ${mark.id} is closed, so it keeps nothing more`);
		const arena = handleArenaOf(node);
		if (arena === undefined) return node;
		if (arena !== this) throw new Error('an engine keeps only the nodes its own builders returned');
		const at = (node as { readonly $at?: unknown }).$at;
		if (typeof at !== 'number') {
			mark.kept.add(node);
			if (this.#parkedOf(node) === undefined) this.#parkOwn(node);
			return node;
		}
		if (this.reads(at) && !this.isRoot(at)) return node;
		this.refuseReleased(this.liveAt(node, at));
		if (!this.#ownedByHandle(at)) this.#giveBack(at);
		mark.kept.add(at);
		return node;
	}

	#parkOwn(leaf: object): void {
		const own = triviaOf(leaf);
		if (own === undefined) return;
		forEachTriviaList(own as TriviaSides<unknown>, (entries) => this.#eachParked(entries, (at) => this.refuseReleased(at)));
		this.#park(leaf, own);
		this.#parked.push(leaf);
	}

	#ownedByHandle(at: number): boolean {
		const { counts, index } = this.#countAt(at);
		return (counts[index]! & this.format.countOwned) !== 0 && (counts[index]! & this.format.countSaturated) !== 0;
	}

	#close(mark: CommitMark, keepAll: boolean): void {
		if (mark.closed) return;
		if (!isLive(this.#handle.current)) {
			for (const open of this.#commits) open.closed = true;
			this.#commits.length = 0;
			return;
		}
		const inner = this.#commits.at(-1)!;
		if (inner !== mark) throw new Error(`commit scope ${mark.id} closed while scope ${inner.id}, opened inside it, is still open: close scope ${inner.id} first`);
		if (this.#scopes > 0) throw new Error(`commit scope ${mark.id} closed while a build is running`);
		this.#commits.pop();
		mark.closed = true;
		if (keepAll) {
			if (this.#commits.length > 0) return;
			this.#forgetMinted(mark.minted);
			this.#parked.length = mark.parked;
			return;
		}
		const keptAt: number[] = [];
		const keptWords: WritableWords[] = [];
		for (let n = mark.minted; n < this.#mintedCount; n++) {
			const at = this.#minted[n]!;
			const words = this.#mintedWords[n]!;
			if (!this.#current(at, words)) continue;
			if (mark.kept.has(at) || this.#kept(at)) {
				keptAt.push(at);
				keptWords.push(words);
			} else if (this.#ownedByHandle(at)) this.release(at);
		}
		const keptLeaf = (leaf: object): boolean => mark.kept.has(leaf) || this.#kept(leaf);
		const keptLeaves = this.#parked.slice(mark.parked).filter(keptLeaf);
		for (let n = mark.parked; n < this.#parked.length; n++) if (!keptLeaf(this.#parked[n]!)) this.releaseHandle(this.#parked[n]!);
		this.#forgetMinted(mark.minted);
		this.#parked.length = mark.parked;
		if (this.#commits.length === 0) return;
		for (let n = 0; n < keptAt.length; n++) this.#recordMinted(keptAt[n]!, keptWords[n]!);
		this.#parked.push(...keptLeaves);
	}

	#current(at: number, words: WritableWords): boolean {
		const chunk = chunkOf(at, this.format);
		return this.#words.current(chunk, words) || (this.#reads[chunk] === words && words.length !== 0);
	}

	#giveBack(at: number): void {
		this.#crossReleases();
		const { counts, index } = this.#countAt(at);
		this.#countOneMore(at, counts, index);
		counts[index] = counts[index]! | this.format.countOwned;
	}

	#crossReleases(): void {
		if (!this.#releasing) return;
		this.#releasing = false;
		this.#cross();
	}

	#countOneMore(at: number, counts: Uint8Array, index: number): void {
		const byte = counts[index]!;
		const count = byte & this.format.countSaturated;
		if (count === 0) throw new Error(releasedRecord(at));
		if (count === this.format.countSaturated) this.#bump(at);
		else counts[index] = byte + 1;
	}

	#countAt(at: number): CountAt {
		const counted = this.#countedAt(at);
		if (counted === undefined) throw new Error(releasedRecord(at));
		return counted;
	}

	#countedAt(at: number): CountAt | undefined {
		const chunk = chunkOf(at, this.format);
		const word = wordOf(at, this.format);
		const live = this.#words.has(chunk) || (this.#readChunk(chunk)?.length ?? 0) !== 0;
		const table = this.#tables[chunk];
		if (table === undefined || !live) return undefined;
		const block = word >>> 6;
		const bit = word & 63;
		const lo = table.bits[block << 1]!;
		const hi = table.bits[(block << 1) | 1]!;
		const starts = bit < 32 ? (lo >>> bit) & 1 : (hi >>> (bit - 32)) & 1;
		if (starts === 0) throw new Error(`no built entry starts at ${at}`);
		const ordinal = table.ranks[block]! + (bit < 32 ? popcount(lo & ((1 << bit) - 1)) : popcount(lo) + popcount(hi & ((1 << (bit - 32)) - 1)));
		if (ordinal >= table.counts.length) throw new Error(`the built entry at ${at} has no count`);
		return { counts: table.counts, index: ordinal };
	}

	/** Holds the entry at `at` once more for a holder that takes the handle naming it, a builder's or a read's: moves the count that handle holds, else takes one more. */
	adopt(at: number): void {
		this.#crossReleases();
		const { counts, index } = this.#countAt(at);
		const byte = counts[index]!;
		const { countOwned } = this.format;
		if ((byte & countOwned) !== 0 && !this.#kept(at)) {
			counts[index] = byte & ~countOwned;
			if (this.#scopes > 0) this.#moved[this.#movedCount++] = at;
			return;
		}
		this.#countOneMore(at, counts, index);
	}

	/** Takes one more count of the entry at `at`, a builder's or a read's, for a holder that only names it: a count the handle naming it holds stays with that handle. */
	hold(at: number): void {
		this.#crossReleases();
		const { counts, index } = this.#countAt(at);
		this.#countOneMore(at, counts, index);
	}

	#kept(held: unknown): boolean {
		return this.#commits.length > 0 && this.#commits.some((mark) => mark.kept.has(held));
	}

	/** Holds once more what the cell `cell` names: a record or run, or a leaf entry's string chunk. */
	holdCell(cell: number): void {
		if (cell === 0) return;
		const at = cell >>> 2;
		const chunk = chunkOf(at, this.format);
		if (chunk === 0) return;
		if (this.#bytes.chunks[chunk] === undefined) this.hold(at);
		else this.holdText(at);
	}

	/** Takes one more count of the string chunk the leaf entry at `at` lies in. */
	holdText(at: number): void {
		this.#crossReleases();
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
		if (this.#bytes.chunks[chunk] !== undefined) {
			const cells = this.#cells[chunk];
			if (cells === undefined || cells.length === 0) throw new Error(releasedRecord(at));
			if (cells[0]! > 1) cells[0] = cells[0]! - 1;
			else this.#release(at, this.format.held.text);
			return;
		}
		this.drop(at, list ? this.format.held.run : this.format.held.record);
	}

	/** Drops one count of the entry at `at`, which `held` names the form of. */
	drop(at: number, held: number): void {
		this.#dropCount(this.#countAt(at), at, held);
	}

	/** Releases the count the handle of the record at `at` holds, a builder's or a parse's root's, a no-op when the handle holds none or its chunk was freed. */
	release(at: number): void {
		const entry = this.#roots.get(at);
		if (entry !== undefined && this.#ownedByHandle(at)) {
			this.#roots.delete(at);
			this.#errors.delete(entry);
		}
		const counted = this.#countedAt(at);
		if (counted === undefined) return;
		const byte = counted.counts[counted.index]!;
		if ((byte & this.format.countOwned) === 0) return;
		counted.counts[counted.index] = byte & ~this.format.countOwned;
		this.#dropCount(counted, at, this.format.held.record);
	}

	#dropCount({ counts, index }: CountAt, at: number, held: number): void {
		const byte = counts[index]!;
		const count = byte & this.format.countSaturated;
		if (count === 0 || count === this.format.countSaturated) {
			this.#release(at, held);
			return;
		}
		counts[index] = byte - 1;
		if (count === 1) this.#release(at, held | this.format.held.dropped);
	}

	/** Releases what the handle `node` holds: its record's count, the count of the parse's root a wrapper with no view of its record holds, or for a leaf not yet placed, the count it holds of each built record its sides park. A record already released, or its count already placed, is passed over, and so is a handle whose record's chunk was freed. */
	releaseHandle(node: object): void {
		const at = (node as { readonly $at?: unknown }).$at;
		if (typeof at === 'number') {
			if (this.#liveRecord(node, at) && ((node as Partial<RecordHandle>).$words?.length ?? 0) !== 0) this.release(at);
			return;
		}
		const root = this.#rootsWithoutView.get(node);
		if (root !== undefined) {
			this.#rootsWithoutView.delete(node);
			this.release(root);
			return;
		}
		this.#unpark(this.#parkedOf(node));
	}

	liveAt(node: object, at: number): number {
		if (!this.#liveRecord(node, at)) throw new Error(freedRecord(at));
		return at;
	}

	#liveRecord(node: object, at: number): boolean {
		const chunk = chunkOf(at, this.format);
		return (node as Partial<RecordHandle>).$words === (this.#words.chunks[chunk] ?? this.#reads[chunk]);
	}

	repark(leaf: object, own: NodeTrivia | undefined, written: NodeTrivia, placed: boolean): NodeTrivia {
		const next = { ...own, ...written };
		if (placed && !this.#kept(leaf)) return next;
		forEachTriviaList(next as TriviaSides<unknown>, (entries) => this.#eachParked(entries, (at) => this.refuseReleased(at)));
		const parked = this.#parkedOf(leaf);
		this.#park(leaf, next);
		if (this.#commits.length > 0) this.#parked.push(leaf);
		this.#unpark(parked);
		return next;
	}

	#park(leaf: object, trivia: NodeTrivia): void {
		forEachTriviaList(trivia as TriviaSides<unknown>, (entries) => this.#eachParked(entries, (at) => this.adopt(at)));
		this.#parkedBy.set(trivia, leaf);
	}

	#parkedOf(leaf: object): NodeTrivia | undefined {
		const trivia = triviaOf(leaf);
		return trivia !== undefined && this.#parkedBy.get(trivia) === leaf ? trivia : undefined;
	}

	#unpark(trivia: NodeTrivia | undefined): void {
		if (trivia === undefined || !this.#parkedBy.delete(trivia)) return;
		forEachTriviaList(trivia as TriviaSides<unknown>, (entries) => this.#eachParked(entries, (at) => this.drop(at, this.format.held.record)));
	}

	#eachParked(entries: readonly unknown[], each: (at: number) => void): void {
		for (const entry of entries) {
			const parked = recordRefOf(entry);
			if (parked?.arena === this) each(parked.at);
		}
	}

	/** Refuses the record at `at` once it is released. */
	refuseReleased(at: number): void {
		this.#crossReleases();
		const { counts, index } = this.#countAt(at);
		if ((counts[index]! & this.format.countSaturated) === 0) throw new Error(releasedRecord(at));
	}

	refuseRender(at: number): void {
		if (isLive(this.#handle.current)) this.refuseReleased(at);
	}

	#copyCells(from: number, kind: number, to: BuiltWords, side: boolean): void {
		const head = wordOf(from, this.format);
		const words = this.#widthOf(kind);
		const data = this.#chunk(from, words);
		if (side) {
			const shared = sideUnderRows(this, data[head + 1]!);
			this.holdCell(shared * 4);
			to.data[to.base + 1] = shared;
		}
		const cells = this.#views.cells[kind] ?? words;
		for (let word = 2; word < cells; word++) to.data[to.base + word] = data[head + word]!;
		for (let word = cells; word < words; word++) {
			this.holdCell(data[head + word]!);
			to.data[to.base + word] = data[head + word]!;
		}
	}

	/** The header word of a record of `kind`, its flags `flags`. */
	header(kind: number, flags = 0): number {
		return (withKind(kind, this.format.kindBits) | (flags << this.format.kindBits)) >>> 0;
	}

	/** The kind the header of the record at `at` names. */
	kindAt(at: number): number {
		return headerKind(this.words(at, 1)[wordOf(at, this.format)]!, this.format);
	}

	record(kind: number): BuiltDraft {
		return this.draft(kind, this.#widthOf(kind));
	}

	draft(kind: number, words: number, copyOf?: number, kept?: Readonly<Record<number, unknown>>, copyOfParsed?: RecordPosition): BuiltDraft {
		const { data, base, at } = this.#mint(words);
		data[base] = this.header(kind);
		return { data, base, at, words, placed: undefined, copyOf, copyOfParsed, kept, patched: undefined };
	}

	copy(source: object, kind: number, place?: number): BuiltDraft {
		const at = builtRecordOf(source, this);
		if (at === undefined) {
			const parsed = isParsedPosition(source) ? source : undefined;
			const draft = this.draft(kind, this.#widthOf(kind), undefined, parsed === undefined ? undefined : cacheOf(parsed as RecordHandle), parsed);
			if (place !== undefined) this.#carry(source, kind, draft, 0, place);
			return draft;
		}
		const found = (source as RecordHandle).$type;
		if (found !== kind) throw new Error(`a $with of a kind ${kind} record was handed a record of kind ${found}`);
		const draft = this.draft(kind, this.#widthOf(kind), at, cacheOf(source as RecordHandle));
		this.#copyCells(at, kind, draft, true);
		return draft;
	}

	carry(source: object, record: BuiltDraft, place: number): void {
		if (record.copyOf !== undefined) return;
		const kind = headerKind(record.data[record.base]!, this.format);
		this.#carry(source, kind, record, place + 1, this.#placesOf(kind).length);
	}

	placeAt(kind: number, at: number): BuiltPlaceRow {
		return this.#placesOf(kind)[at]!;
	}

	#placesOf(kind: number): readonly BuiltPlaceRow[] {
		const places = this.#views.places[kind];
		if (places === undefined) throw new Error(`no builder writes records of kind ${kind} slot by slot, so the arena has no places for one`);
		return places;
	}

	keep(record: BuiltDraft, word: number): void {
		const source = record.copyOfParsed;
		if (source === undefined) return;
		const kind = headerKind(record.data[record.base]!, this.format);
		const place = this.#placesOf(kind).find((row) => row.length === 6 && row[0] === word);
		if (place === undefined) throw new Error(`a kind ${kind} record keeps no cell at word ${word}`);
		this.#carryPlace(source, record, place);
	}

	#carry(source: object, kind: number, record: BuiltDraft, from: number, to: number): void {
		if (!isParsedPosition(source)) throw new Error(`a $with of one slot of kind ${kind} copies a record, not ${String(source)}`);
		const places = this.#placesOf(kind);
		for (let n = from; n < to; n++) this.#carryPlace(source, record, places[n]!);
	}

	#carryPlace(source: RecordPosition, record: BuiltDraft, place: BuiltPlaceRow): void {
		if (place.length === 2) {
			const [word, bit] = place;
			if (recordFlag(source, word, bit)) storeFlag(record.data, record.base + word, 2 ** bit);
			return;
		}
		if (place.length === 3) {
			const [, delimiter, separator] = place;
			storeListOptions(this, record, delimiter ? recordDelimiter(source) : undefined, separator ? recordSeparator(source) : undefined);
			return;
		}
		const [word, built, width, forms, run] = place;
		const read = (value: unknown): unknown => (typeof value === 'object' && value !== null ? carryTree(source, value) : value);
		if (run === 0) storeCell(this, record, built, word, read(recordSlot(source, word, width, forms, built)));
		else storeList(this, record, built, word, recordSlots(source, word, width, run, forms, built, read));
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
		this.#crossReleases();
		const texts = (this.#entries[kind] ??= new Map());
		const known = texts.get(text);
		if (known !== undefined && this.#live(known)) return known;
		const tail = this.#bytes.tail();
		const inPlace = tail === undefined ? undefined : encodedInto(text, tail.data, tail.word + ENTRY_HEAD_BYTES);
		const bytes = inPlace === undefined ? encoder.encode(text) : undefined;
		const length = inPlace ?? bytes!.length;
		const { kindBits } = this.format;
		if (length >= 2 ** (32 - kindBits)) throw new Error(`a built leaf's text of ${length} bytes is past what a leaf entry's length holds`);
		const size = (ENTRY_HEAD_BYTES + length + 3) & ~3;
		const target = bytes === undefined ? this.#bytes.claimTail(size) : this.#bytes.alloc(size);
		if (bytes !== undefined) target.data.set(bytes, target.word + ENTRY_HEAD_BYTES);
		const heads = this.#heads[target.chunk]!;
		heads[target.word >>> 2] = (withKind(kind, kindBits) | (length * 2 ** kindBits)) >>> 0;
		const entry: BuiltText = { at: addressOf(target.chunk, target.word, this.format), kind, text, data: target.data };
		texts.set(text, entry);
		(this.#entryAt[target.chunk] ??= new Map()).set(entry.at, entry);
		return entry;
	}

	/** The entry of `leaf`, of kind `kind`, interned at its first placement: a leaf placed before keeps its entry. */
	placeEntry(leaf: object, kind: number, entry: BuiltText): BuiltText {
		this.#crossReleases();
		if (entry.at !== 0 && this.#live(entry)) return entry;
		const placed = this.entry(kind, entry.text ?? '');
		(leaf as { $entry: BuiltText }).$entry = placed;
		return placed;
	}

	#live(entry: BuiltText): boolean {
		return this.#bytes.current(chunkOf(entry.at, this.format), entry.data);
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
		const entry: BuiltText = { at, kind, text: decoder.decode(data.subarray(byte + ENTRY_HEAD_BYTES, byte + ENTRY_HEAD_BYTES + len)), data };
		(this.#entryAt[chunk] ??= new Map()).set(at, entry);
		return { kind, len, entry };
	}

	/** The text of the leaf entry `entry`. */
	entryText(entry: BuiltText): string {
		return entry.text ?? this.entryAt(entry.at).entry.text ?? '';
	}

	/** The link record naming the node a read left in the cell at `site` of its record at `holder` (no site for the content sharing the record's own row), a node of `kind` with no record of its own, spanning `span`, with one count for the cell that names it. */
	linkRow(kind: number, holder: number, site: CellSite | undefined, span: { readonly start: number; readonly end: number }): number {
		const words = [this.header(kind, this.format.linkFlag), 0, holder, site?.[0] ?? 0, site?.[1] ?? 0, 0, span.start, span.end];
		if (words.length !== this.format.linkWords) throw new Error(`a link record takes ${this.format.linkWords} words, not ${words.length}`);
		this.hold(holder);
		return this.push(words, 1);
	}

	#linkHeld(at: number): boolean {
		const { counts, index } = this.#countAt(at);
		return (counts[index]! & this.format.countSaturated) !== 0;
	}

	/** The chunk `at` lies in, `length` words from `at` of it written. */
	words(at: number, length: number): ChunkWords {
		return this.#chunk(at, length);
	}

	/** The entries `side` of the built record at `at` holds, as their wires: the gap kinds its header's codes keep, then its row's entries; `undefined` when it holds neither. */
	#ownSide(at: number, side: TriviaSideName): WireNode[] | undefined {
		const words = this.words(at, 2);
		const start = wordOf(at, this.format);
		const gaps = headerGapKinds(words[start]!, this.format, side);
		const row = decodeSideRows(this, words[start + 1]!)?.[side];
		if (row === undefined) return gaps.length === 0 ? undefined : gaps;
		return [...gaps, ...this.#rowEntries(row)];
	}

	/** The entries of the row whose list cell is `cell`, as their wires: a layout member its kind id, a comment record or `ERROR` its kind and address, a leaf entry its kind and text. */
	#rowEntries(cell: number): WireNode[] {
		const { run, len } = decodeListCell(this, cell);
		if (len === 0) return [];
		const cells = this.words(run, len);
		const start = wordOf(run, this.format);
		const entries: WireNode[] = [];
		for (let n = 0; n < len; n++) {
			const entry = decodeBuiltCell(this, cells[start + n]!);
			if (entry.form === 'unit' && entry.kind !== BLANK_KIND_ID) entries.push(entry.kind);
			else if (entry.form === 'child') entries.push({ $type: entry.kind, $record: entry.at } as WireNode);
			else if (entry.form === 'builtLeaf') entries.push({ $type: entry.kind, $text: this.entryAt(entry.offset).entry.text } as WireNode);
			else if (entry.form === 'builtText') entries.push({ $type: BLANK_KIND_ID, $text: this.entryAt(entry.offset).entry.text } as WireNode);
			else throw new Error(`a side's row holds a ${entry.form} cell, which no write gives a side`);
		}
		return entries;
	}

	/** Replaces `side` of the node the key `at` names (`keyName`) with `entries`. A built record keeps the gap kinds at the side's head, as many as its header keeps codes for, as those codes, and the rest as its row, none when the codes hold the whole side. A node a parse left keeps them as the row of an entry of its read's list of replaced ranges (`#writeReplaced`). */
	writeSide(at: number, side: TriviaSideName, entries: readonly WireNode[]): void {
		const { node, site } = keyName(at, this.format.nodeId);
		if (site !== 0 || this.reads(node)) return this.#writeReplaced(at, node, site, side, entries);
		this.#setRow(at, side, this.#headerSplit(at, side, this.#keptEntries(entries)));
	}

	/** `side` of the node a parse left that `key` names, the record at `node` or its cell at the packed `site`, replaced with `entries`: an entry of its read's list of replaced ranges whose row holds them whole, at the byte the side starts at in the source (`#sideOffset`), in place of the entry it held for the side. A list one count holds that held one is written over, its row too where it can be (`#placeRowOver`), and a row it no longer names given back; any other list is written anew, holding each row it keeps once more, and the old one given back. A cell's inner side is refused unless empty, and so is the inner side of a node that is not empty. */
	#writeReplaced(key: number, node: number, site: number, side: TriviaSideName, entries: readonly WireNode[]): void {
		const source = this.sourceOf(node);
		if (side === 'inner' && site !== 0) {
			if (entries.length > 0) throw new Error(NO_INSIDE);
			return;
		}
		if (side === 'inner' && !this.tree.isEmpty!(node)) throw new Error(NOT_EMPTY);
		const offset = this.#sideOffset(key, node, site, side);
		const cells = this.#keptEntries(entries).map((entry) => entry.cell);
		const read = this.#readSideOf(source);
		const start = wordOf(read, this.format);
		const list = this.#chunk(read, 2)[start + 1]!;
		const code = this.format.sideCodes[side];
		const ranges = this.#replacedOf(source);
		const at = ranges.findIndex((range) => range.node === node && range.site === site && range.side === code);
		const old = ranges[at];
		const kept = ranges.filter((_, n) => n !== at);
		const inPlace = old !== undefined && this.#countOf(list >>> 2) === 1;
		if (!inPlace) for (const range of kept) if (range.row !== 0) this.hold(range.row >>> 2);
		const row = this.#placeRowOver(inPlace ? old.row : undefined, cells);
		const words = this.#replacedWords([...kept, { node, site, side: code, offset, row }]);
		if (inPlace) {
			this.#chunk(list >>> 2, words.length).set(words, wordOf(list >>> 2, this.format));
			if (old.row !== 0 && old.row !== row) this.drop(old.row >>> 2, this.format.held.run);
			return;
		}
		this.#chunk(read, 2)[start + 1] = builtCell(this.push(words, 1));
		if (list !== 0) this.drop(list >>> 2, this.format.held.replaced);
	}

	/** Where `side` of the node a parse left that `key` names starts in its source: a trailing side where the node ends; a leading or inner side where the first record its parse placed there starts, else where the node starts. */
	#sideOffset(key: number, node: number, site: number, side: TriviaSideName): number {
		const span = site === 0 ? this.#parsedSpan(node) : this.#siteSpan(key, node, site);
		if (side === 'trailing') return span.end;
		const placed = this.#placedRow(this.#sideWordOf(node), site, side);
		const first = placed === undefined || placed === 0 ? undefined : this.#rowEntries(placed).find((entry) => (entry as { readonly $record?: number }).$record !== undefined);
		return first === undefined ? span.start : this.#parsedSpan((first as { readonly $record: number }).$record).start;
	}

	#parsedSpan(at: number): ByteSpan {
		return (coordinateOf(readPosition(this.tree, at)) as unknown as { readonly $span: ByteSpan }).$span;
	}

	/** The bytes of the node at the packed `site` of the record a parse left at `node`: a leaf's from its cell, a unit's, which its cell keeps no span of, from the source (`unitSpan`). */
	#siteSpan(key: number, node: number, site: number): ByteSpan {
		const [word, item] = unpackedSite(site, this.format.nodeId);
		const cell = this.#parsedCellAt(node, this.#cellPlace(this.kindAt(node), word), item);
		if (cell?.form === 'unit') return this.#unitSpan(key);
		if (cell?.form === 'parsedLeaf') return cell.span;
		throw new Error(`the site at word ${word}, item ${item} of the record at ${node} names no leaf or unit`);
	}

	/** `ranges` as the words of a list of replaced ranges: its length, then each entry's record, its packed site above its side's code, its offset and its row, by offset, then record, then site, then side. */
	#replacedWords(ranges: ReplacedRange[]): number[] {
		const shift = 2 ** this.format.sideReplaced.siteShift;
		ranges.sort((a, b) => a.offset - b.offset || a.node - b.node || a.site - b.site || a.side - b.side);
		return [ranges.length, ...ranges.flatMap((range) => [range.node, range.site * shift + range.side, range.offset, range.row])];
	}

	/** Replaces `side` of the built leaf at each site `sites` names, `[holder, word, item]` after another, with `entries`, each site's row holding them anew. */
	writeLeafSide(sites: readonly number[], side: TriviaSideName, entries: readonly WireNode[]): void {
		if (sites.length % 3 !== 0) throw new Error(`a leaf's sites are holder, word and item triples, not ${sites.length} numbers`);
		for (let n = 0; n < sites.length; n += 3) if (sites[n] === 0) throw new Error(RECORD_ZERO);
		for (let n = 0; n < sites.length; n += 3) this.#writeSiteSide(sites[n]!, sites[n + 1]!, sites[n + 2]!, side, entries);
	}

	/** Gives the units the built record at `at` holds the sides `units` gives, in place of every unit side it had. For a record a read left, each side `units` gives is written as a read node's side is, and every other side of its units stays. */
	writeUnitSides(at: number, units: readonly UnitSidesWire[]): void {
		const kind = this.kindAt(at);
		const placed = units.map((unit) => ({ unit, word: this.#slotWord(kind, unit.slot) }));
		if (this.reads(at)) {
			for (const { unit, word } of placed) {
				const key = coordinateIndex({ $node: at, $site: [word, unit.item] } as unknown as NodeCoordinate, this.format.nodeId);
				for (const side of TRIVIA_SIDE_NAMES) {
					const entries = unit[side];
					if (entries !== undefined) this.writeSide(key, side, entries);
				}
			}
			return;
		}
		for (const { unit } of placed) if (unit.inner !== undefined && unit.inner.length > 0) throw new Error(NO_INSIDE);
		const written = placed.flatMap(({ unit, word }) =>
			(['leading', 'trailing'] as const).flatMap((side) => {
				const entries = unit[side];
				return entries === undefined ? [] : [{ key: siteKey(word, unit.item, side, this.format)!, cells: this.#keptEntries(entries).map((entry) => entry.cell) }];
			})
		);
		const side = this.#sideWordOf(at);
		const old = decodeSideRows(this, side);
		const rows = editableRows(old);
		const unitRows = old === undefined ? [] : old.sites.filter(([key]) => this.#siteHoldsUnit(at, kind, key));
		rows.sites = rows.sites.filter(([key]) => !unitRows.some(([unit]) => unit === key));
		const exclusive = old !== undefined && this.#countOf(side) === 1;
		for (const { key, cells } of written) {
			const was = exclusive ? unitRows.find(([unit]) => unit === key)?.[1] : undefined;
			setRowAt(rows, key, this.#placeRowOver(was, cells));
		}
		this.#writeOver(at, side, old, rows);
	}

	#writeSiteSide(holder: number, word: number, item: number, side: TriviaSideName, entries: readonly WireNode[]): void {
		if (side === 'inner') {
			if (entries.length > 0) throw new Error(NO_INSIDE);
			return;
		}
		if (this.reads(holder)) throw new Error(READ_SIDE);
		this.#setRow(holder, siteKey(word, item, side, this.format)!, this.#keptEntries(entries).map((entry) => entry.cell));
	}

	/** `entries` as the side holds them: a layout member as its unit, a record, built or a read's, as itself, the count its handle holds moved to the side or one more taken, a node a read left named by its record as that record, and a kind with text as a leaf entry, which holds its string chunk once more. Refuses any other entry, and a node named by no record a read left, before any is written. */
	#keptEntries(entries: readonly WireNode[], take: (at: number) => void = (at) => this.adopt(at)): KeptEntry[] {
		const forms = entries.map((entry) => keptForm(entry, this));
		const kept = forms.map((form): KeptEntry => {
			if (form.form === 'layout') return { cell: unitCell(form.kind, this.format), layout: form.kind, counted: false };
			if (form.form === 'record') return { cell: builtCell(form.at), counted: form.adopt };
			const entry = this.entry(form.kind === BLANK_KIND_ID ? 0 : form.kind, form.text);
			this.holdText(entry.at);
			return { cell: builtCell(entry.at), counted: true };
		});
		for (const form of forms) if (form.form === 'record' && form.adopt) take(form.at);
		return kept;
	}

	/** `use`'s answer, given `sides` kept as a side keeps its entries (`#keptEntries`), each side as its entries' cells, or `null` for no sides: a record a handle names is held once more rather than taken from its handle, and every count the cells hold is given back once `use` returns. */
	withKeptSides<T>(sides: TriviaSides<WireNode> | undefined, use: (cells: TriviaSides<number> | null) => T): T {
		if (sides === undefined) return use(null);
		const counted: number[] = [];
		const keep = (entries: readonly WireNode[]): number[] =>
			this.#keptEntries(entries, (at) => this.hold(at)).map((entry) => {
				if (entry.counted) counted.push(entry.cell);
				return entry.cell;
			});
		try {
			return use(mapTriviaEntries(sides, keep));
		} finally {
			for (const cell of counted) this.dropCell(cell, false);
		}
	}

	/** `kept`, written to `side` of the record at `at`: the gap members at its head, as many as the header keeps codes for the side, set as those codes, and the rest the side's row, none when the codes hold the whole side. An inner side keeps no codes. */
	#headerSplit(at: number, side: TriviaSideName, kept: readonly KeptEntry[]): number[] | undefined {
		const cells = kept.map((entry) => entry.cell);
		if (side === 'inner') return cells;
		const { codeBits, leadingCodes, trailingCodes, gapKinds, none } = this.format.layout;
		const [first, count] = side === 'leading' ? [0, leadingCodes] : [leadingCodes, trailingCodes];
		const codes: number[] = [];
		for (const { layout } of kept) {
			if (codes.length === count || layout === undefined || layout === none) break;
			const code = gapKinds.indexOf(layout);
			if (code <= 0) break;
			codes.push(code);
		}
		const words = this.#chunk(at, 1);
		const start = wordOf(at, this.format);
		const shift = this.format.kindBits + this.format.flagBits;
		const field = (1 << codeBits) - 1;
		let header = words[start]!;
		for (let n = 0; n < count; n++) {
			const bit = shift + (first + n) * codeBits;
			header = ((header & ~(field << bit)) | ((codes[n] ?? 0) << bit)) >>> 0;
		}
		words[start] = header;
		const row = cells.slice(codes.length);
		return codes.length === 0 || row.length > 0 ? row : undefined;
	}

	/** The record at `holder` holds `cells` as the row of `slot`, its own side's or the site's whose key it is, or none, its old row written over where one count holds it (`#placeRowOver`) and its side record of rows written over (`#writeOver`). */
	#setRow(holder: number, slot: TriviaSideName | number, cells: readonly number[] | undefined): void {
		const side = this.#sideWordOf(holder);
		const old = decodeSideRows(this, side);
		const was = old !== undefined && this.#countOf(side) === 1 ? rowAt(old, slot) : undefined;
		const rows = editableRows(old);
		setRowAt(rows, slot, cells === undefined ? undefined : this.#placeRowOver(was, cells));
		this.#writeOver(holder, side, old, rows);
	}

	/** The row of `cells` as a run, written over the run the list cell `old` names when one count holds it and it holds at least as many items, the counts its items held given back; else placed anew, held once. The empty row is 0. */
	#placeRowOver(old: number | undefined, cells: readonly number[]): number {
		if (old !== undefined && old !== 0 && cells.length > 0) {
			const at = old >>> 2;
			const start = wordOf(at, this.format);
			const len = this.words(at, 1)[start]!;
			if (this.#countOf(at) === 1 && len >= cells.length) {
				const run = this.#chunk(at, len + 1);
				for (let n = 1; n <= len; n++) this.dropCell(run[start + n]!, false);
				run[start] = cells.length;
				run.set(cells, start + 1);
				return old;
			}
		}
		if (cells.length === 0) return 0;
		const run = this.run(cells.length);
		run.data.set(cells, run.base + 1);
		return builtCell(run.at);
	}

	/** The record at `at`, whose side word names `side` with the rows `old`, holds `rows`, each row new to it placed and held once. A side record of rows names the one it was written over. One held only by `at`, of the same fields, is written in place and the rows it no longer names dropped; any other is written anew, holding once more each row it keeps and the one under it, and `at`'s count of the old given back. */
	#writeOver(at: number, side: number, old: SideRows | undefined, rows: EditableRows): void {
		rows.next = old === undefined ? side : old.next;
		if (old === undefined) {
			if (holdsRows(rows)) this.#setSideWord(at, this.push(this.#rowWords(rows), 1));
			return;
		}
		if (!holdsRows(rows)) {
			if (rows.next !== 0) this.hold(rows.next);
			this.#setSideWord(at, rows.next);
			this.drop(side, this.format.held.side);
			return;
		}
		const words = this.#rowWords(rows);
		const was = rowCells(old);
		const now = rowCells(rows);
		const sameFields = words.length === this.#rowWords(old).length && old.sites.length === rows.sites.length && old.sites.every(([key], n) => rows.sites[n]![0] === key) && (['leading', 'trailing', 'inner'] as const).every((name) => (old[name] === undefined) === (rows[name] === undefined));
		if (sameFields && this.#countOf(side) === 1) {
			this.#chunk(side, words.length).set(words, wordOf(side, this.format));
			for (let n = 0; n < was.length; n++) if (was[n] !== now[n] && was[n] !== 0) this.drop(was[n]! >>> 2, this.format.held.run);
			return;
		}
		for (const cell of now) if (cell !== 0 && was.includes(cell)) this.hold(cell >>> 2);
		if (rows.next !== 0) this.hold(rows.next);
		this.#setSideWord(at, this.push(words, 1));
		this.drop(side, this.format.held.side);
	}

	/** The words of a side record of rows: its mask, then `next`, its own sides' rows and its sites, a count then each key and row, where present. */
	#rowWords(rows: SideRows): number[] {
		const fields = this.format.sideRows;
		const words = [0];
		let mask = 0;
		if (rows.next !== 0) {
			mask |= fields.next;
			words.push(rows.next);
		}
		for (const [bit, row] of [
			[fields.leading, rows.leading],
			[fields.trailing, rows.trailing],
			[fields.inner, rows.inner]
		] as const) {
			if (row === undefined) continue;
			mask |= bit;
			words.push(row);
		}
		if (rows.sites.length > 0) {
			mask |= fields.sites;
			words.push(rows.sites.length);
			for (const [key, cell] of rows.sites) words.push(key, cell);
		}
		words[0] = mask;
		return words;
	}

	#sideWordOf(at: number): number {
		return this.words(at, 2)[wordOf(at, this.format) + 1]!;
	}

	#setSideWord(at: number, side: number): void {
		this.#chunk(at, 2)[wordOf(at, this.format) + 1] = side;
	}

	#countOf(at: number): number {
		const { counts, index } = this.#countAt(at);
		return counts[index]! & this.format.countSaturated;
	}

	/** The stamped word of the cell a record of `kind` holds `slot` in. */
	#slotWord(kind: number, slot: string): number {
		const place = this.#placesOf(kind).find((row): row is Extract<BuiltPlaceRow, { readonly length: 6 }> => row.length === 6 && row[5] === slot);
		if (place === undefined) throw new Error(`a record writer does not write slot ${slot}, which a record of kind ${kind} has no cell for`);
		return place[0];
	}

	/** Whether the site key `key` of the built record at `at`, of `kind`, names a unit's cell. */
	#siteHoldsUnit(at: number, kind: number, key: number): boolean {
		const { word, item } = siteOfKey(key, this.format);
		return this.#holdsUnit(at, this.#cellPlace(kind, word), item);
	}

	/** `side` of the node a read left that `key` names (`keyName`), as its wires: the row its read's list of replaced ranges holds for the side, else the gap kinds its record's header keeps for a side of its own and the row its record's rows hold, each record its read left for a node that renders as its source named by that node (`#parsePlaced`). */
	readSide(key: number, side: TriviaSideName): WireNode[] {
		const { node, site } = keyName(key, this.format.nodeId);
		if (site !== 0 && side === 'inner') return [];
		const source = this.sourceOf(node);
		const replaced = this.#replacedOf(source);
		const code = this.format.sideCodes[side];
		const written = replaced.find((entry) => entry.node === node && entry.site === site && entry.side === code);
		const words = this.words(node, 2);
		const start = wordOf(node, this.format);
		const gaps = written === undefined && site === 0 ? headerGapKinds(words[start]!, this.format, side) : [];
		const row = written?.row ?? this.#placedRow(words[start + 1]!, site, side);
		const entries = row === undefined || row === 0 ? [] : this.#rowEntries(row).map((entry) => this.#parsePlaced(source, entry, replaced));
		return [...gaps, ...entries];
	}

	/** The sides of the units the read's record `key` names holds (`keyName`), by slot and item, as their wires: each of its record's site rows, with its read's list of replaced ranges in their place, whose cell is a unit's; none for a node a site names. */
	readUnitSides(key: number): UnitSidesWire[] {
		const { node, site } = keyName(key, this.format.nodeId);
		if (site !== 0) return [];
		const kind = this.kindAt(node);
		const units: { slot: string; item: number; leading?: WireNode[]; trailing?: WireNode[] }[] = [];
		let last: { readonly word: number; readonly item: number } | undefined;
		for (const [key, cell] of this.#siteRows(node)) {
			const { word, item, side } = siteOfKey(key, this.format);
			const place = this.#cellPlace(kind, word);
			if (!this.#readHoldsUnit(node, place, item)) continue;
			if (last?.word !== word || last.item !== item) units.push({ slot: place[5], item });
			last = { word, item };
			units[units.length - 1]![side] = cell === 0 ? [] : this.#rowEntries(cell);
		}
		return units;
	}

	/** The row the side record of rows `sideWord` names holds for `side` of the record's own node, or of the node at the packed `site`. */
	#placedRow(sideWord: number, site: number, side: TriviaSideName): number | undefined {
		const rows = decodeSideRows(this, sideWord);
		if (rows === undefined) return undefined;
		if (site === 0) return rows[side];
		const [word, item] = unpackedSite(site, this.format.nodeId);
		const key = siteKey(word, item, side, this.format);
		return rows.sites.find(([at]) => at === key)?.[1];
	}

	/** The entries of the list of replaced ranges of the read whose source entry is `source`: each the record its node is kept in, its site packed (`keyName`), its side's code and its row's list cell. */
	#replacedOf(source: number): ReplacedRange[] {
		const read = this.#readSideOf(source);
		if (read === 0) return [];
		const head = this.words(read, 2);
		const start = wordOf(read, this.format);
		if ((head[start]! & this.format.sideReplaced.bit) === 0) return [];
		const { run, len } = decodeListCell(this, head[start + 1]!);
		if (len === 0) return [];
		const { entryWords, sideBits, slot, siteShift } = this.format.sideReplaced;
		const words = this.words(run, len * entryWords);
		const first = wordOf(run, this.format);
		return Array.from({ length: len }, (_, n) => {
			const at = first + n * entryWords;
			const key = words[at + 1]!;
			if ((key & slot) !== 0) throw new Error(`a replaced range at ${run} names a slot, which no write gives a read's list`);
			return { node: words[at]!, site: key >>> siteShift, side: key & ((1 << sideBits) - 1), offset: words[at + 2]!, row: words[at + 3]! };
		});
	}

	/** The address of the side record of the read whose source entry is `source`, 0 for none. */
	#readSideOf(source: number): number {
		const bytes = this.#readBytes(chunkOf(source, this.format));
		if (bytes === undefined || bytes.length === 0) throw new Error(releasedRecord(source));
		return byteWord(bytes, wordOf(source, this.format) + this.format.sourceEntry.readSideByte);
	}

	/** `entry` of a side of a node of the read whose source entry is `source`, as its parse placed it: a record that read left for a node that renders as its source, no entry of `replaced` replacing its inner side, as that node's coordinate, an `ERROR` as its kind and source text; any other entry as it is. */
	#parsePlaced(source: number, entry: WireNode, replaced: readonly ReplacedRange[]): WireNode {
		const at = typeof entry === 'object' && entry !== null ? (entry as { readonly $record?: number }).$record : undefined;
		if (at === undefined || !this.reads(at) || this.sourceOf(at) !== source) return entry;
		if (replaced.some((range) => range.node === at && range.site === 0 && range.side === this.format.sideCodes.inner)) return entry;
		const coordinate = coordinateOf(readPosition(this.tree, at)) as unknown as { readonly $span: ByteSpan; readonly $type: number };
		if (coordinate.$type === ERROR_KIND_ID) return { $type: ERROR_KIND_ID, $text: this.readText(at, coordinate.$span, source) } as WireNode;
		return { $node: at, $span: coordinate.$span, $type: coordinate.$type } as WireNode;
	}

	/** Whether the cell `place` names in the read's record at `at`, at `item` of a list, is a unit's. */
	#readHoldsUnit(at: number, place: Extract<BuiltPlaceRow, { readonly length: 6 }>, item: number): boolean {
		return this.#parsedCellAt(at, place, item)?.form === 'unit';
	}

	/** The cell `place` names in the read's record at `at`, at `item` of a list; none past the list's items. */
	#parsedCellAt(at: number, place: Extract<BuiltPlaceRow, { readonly length: 6 }>, item: number): ReturnType<typeof decodeParsedCell> | undefined {
		const [word, , width, forms, run] = place;
		const start = wordOf(at, this.format);
		if (run === 0) return item === 0 ? decodeParsedCell(this.words(at, word + width), start + word, forms, this.format) : undefined;
		const list = decodeListCell(this, this.words(at, word + 1)[start + word]!);
		if (item >= list.len) return undefined;
		return decodeParsedCell(this.words(list.run, list.len * run), wordOf(list.run, this.format) + item * run, forms, this.format);
	}

	/** Whether a read wrote the record at `at`, as against a builder. */
	reads(at: number): boolean {
		return this.#readChunk(chunkOf(at, this.format)) !== undefined;
	}

	#readChunk(chunk: number): WritableWords | undefined {
		const read = this.#readMemory(chunk);
		return read instanceof Uint8Array ? undefined : read;
	}

	#readBytes(chunk: number): Uint8Array | undefined {
		const read = this.#readMemory(chunk);
		return read instanceof Uint8Array ? read : undefined;
	}

	#readMemory(chunk: number): WritableWords | Uint8Array | undefined {
		const held = this.#reads[chunk];
		if (held !== undefined && held.length !== 0) return held;
		if (chunk === 0 || this.#words.has(chunk) || this.#bytes.has(chunk)) return undefined;
		const read = this.#read(chunk);
		if (read === undefined) return held;
		if (held !== undefined) this.#sweep([chunk]);
		this.#words.vacate(chunk);
		this.#bytes.vacate(chunk);
		if ('bytes' in read) return (this.#reads[chunk] = read.bytes);
		this.#tables[chunk] = { ...countViews(read.meta, read.data.length), ranked: 0 };
		return (this.#reads[chunk] = read.data);
	}

	#chunk(at: number, length: number): WritableWords {
		const chunk = chunkOf(at, this.format);
		const read = this.#readChunk(chunk);
		if (read === undefined && this.#words.released(chunk)) throw new Error(releasedRecord(at));
		if (read !== undefined) {
			if (read.length === 0) throw new Error(releasedRecord(at));
			if (wordOf(at, this.format) + length > read.length) throw new Error(`a read's record runs past its chunk (address ${at}, ${length} words)`);
			return read;
		}
		if (!this.#words.holds(chunk, wordOf(at, this.format), length)) {
			throw new Error(`a built record read runs past its arena's words (address ${at}, ${length} words)`);
		}
		return this.#words.chunks[chunk]!;
	}

	/** Whether chunk `chunk` holds records, as against leaf entries. */
	holdsRecords(chunk: number): boolean {
		return this.#words.has(chunk) || this.#readChunk(chunk) !== undefined;
	}

	chunks(): BuiltChunks {
		const cut = <A extends WritableWords | Uint8Array>(table: Chunks<A>): A[] =>
			table.chunks.map((chunk, n) => chunk.subarray(0, table.written(n)) as A);
		return { words: cut(this.#words), bytes: cut(this.#bytes) };
	}

	#view(at: number, kind: number, words?: WritableWords): object {
		const position: RecordPosition & Pick<RecordHandle, '$words'> = { $type: kind, $tree: this.tree, $at: at, $_layout: undefined, $words: words };
		return keepExemplar(this.#exemplars, this.#wrap(position, this.tree) as object);
	}

	/** The handle of the drafted `record`. Each built leaf it holds is placed at its site there. */
	view(record: BuiltDraft): object {
		const placed = record.placed;
		for (let n = 0; placed !== undefined && n < placed.length; n += 3) this.#site(placed[n] as object, record.at, placed[n + 1] as number, placed[n + 2] as number);
		if (record.copyOf !== undefined) this.#copySites(record.copyOf, record.at, record.patched ?? []);
		const node = this.#view(record.at, headerKind(record.data[record.base]!, this.format), record.data);
		this.#placedLast = placed === undefined ? undefined : { node, placed };
		return node;
	}

	/** A leaf of text `text` made by `maker`, as a built leaf of this arena: it has no record, and its entry is interned when it is first placed. */
	leaf(maker: LeafMaker, text: string): object {
		return keepExemplar(this.#exemplars, maker(this.tree, { at: 0, text }, undefined));
	}

	/**
	 * The handle of the built leaf of `kind` whose entry is at `at`, at its site in the record at `holder`.
	 *
	 * @throws For a kind no builder writes leaves of.
	 */
	leafAt(kind: number, at: number, holder: number, word: number, item: number): object {
		const maker = this.#views.leaves[kind];
		if (maker === undefined) throw new Error(`no builder writes leaves of kind ${kind}, so the arena has no leaf handle for one`);
		return keepExemplar(this.#exemplars, maker(this.tree, this.entryAt(at).entry, packSite(holder, word, item)));
	}

	textNode(entry: { readonly $type: number; readonly $text: string }): object {
		const maker = this.#views.leaves[entry.$type];
		if (maker !== undefined) return this.leaf(maker, entry.$text);
		const read = asReadOutput({ ...entry });
		holdReadTree(read, this.token);
		return this.#wrap(read, this.tree) as object;
	}

	#site(leaf: object, holder: number, word: number, item: number): void {
		const parked = this.#kept(leaf) ? undefined : this.#parkedOf(leaf);
		placeLeaf(leaf, holder, word, item, this.#siteAlive);
		this.#writeLeafSites(leaf, [holder, word, item]);
		this.#unpark(parked);
		if (parked !== undefined && this.#scopes > 0) this.#undos[this.#undosCount++] = () => this.#park(leaf, parked);
	}

	leafSites(leaf: object): readonly number[] | undefined {
		return leafSitesOf(leaf, this.#siteAlive);
	}

	/** The entries a write gave `side` of the built leaf at the site `holder`, `word`, `item`, from its holder's sites; `undefined` for none. */
	leafSide(holder: number, word: number, item: number, side: TriviaSideName): unknown[] | undefined {
		const key = siteKey(word, item, side, this.format);
		const cell = key === undefined ? undefined : this.#sitesOf(holder).find(([site]) => site === key)?.[1];
		return cell === undefined ? undefined : readEntries(this.tree, this.#rowEntries(cell));
	}

	/** Writes the rows of every unit and leaf site of the record at `from`, a read's with its read's list of replaced ranges in their place, at the same site of the record at `to`, except a site at a word `skip` names; each copied row is held once more. */
	#copySites(from: number, to: number, skip: readonly number[]): void {
		this.settle(from);
		const own = this.#sitesOf(from);
		if (own.length === 0) return;
		const copied = this.#siteRows(from, own).filter(([key]) => !skip.includes(siteOfKey(key, this.format).word));
		if (copied.length === 0) return;
		for (const [, cell] of copied) if (cell !== 0) this.hold(cell >>> 2);
		const side = this.#sideWordOf(to);
		const old = decodeSideRows(this, side);
		const rows = editableRows(old);
		for (const [key, cell] of copied) setRowAt(rows, key, cell);
		this.#writeOver(to, side, old, rows);
	}

	/** The rows of the sites of the record at `at`, by key in key order: for a record a read left, its read's list of replaced ranges holds a site's row in place of its own. */
	#siteRows(at: number, own: readonly (readonly [key: number, cell: number])[] = this.#sitesOf(at)): (readonly [key: number, cell: number])[] {
		if (!this.reads(at)) return [...own];
		const sites = new Map(own);
		for (const entry of this.#replacedOf(this.sourceOf(at))) {
			if (entry.node !== at || entry.site === 0) continue;
			const [word, item] = unpackedSite(entry.site, this.format.nodeId);
			sites.set(siteKey(word, item, entry.side === this.format.sideCodes.trailing ? 'trailing' : 'leading', this.format)!, entry.row);
		}
		return [...sites].sort(([a], [b]) => a - b);
	}

	/** The sites the record at `at` holds rows for, by key in key order: none when its side record holds no rows. */
	#sitesOf(at: number): readonly (readonly [key: number, cell: number])[] {
		return decodeSideRows(this, this.words(at, 2)[wordOf(at, this.format) + 1]!)?.sites ?? [];
	}

	/** The sides of the units the built record at `at` holds, by slot and item, as their wires: each of its sites whose cell is a unit cell. */
	#ownUnits(at: number): UnitSidesWire[] {
		const sites = this.#sitesOf(at);
		if (sites.length === 0) return [];
		const kind = this.kindAt(at);
		const units: { slot: string; item: number; leading?: WireNode[]; trailing?: WireNode[] }[] = [];
		let last: { readonly word: number; readonly item: number } | undefined;
		for (const [key, cell] of sites) {
			const { word, item, side } = siteOfKey(key, this.format);
			const place = this.#cellPlace(kind, word);
			if (!this.#holdsUnit(at, place, item)) continue;
			if (last?.word !== word || last.item !== item) units.push({ slot: place[5], item });
			last = { word, item };
			units[units.length - 1]![side] = this.#rowEntries(cell);
		}
		return units;
	}

	/** The place row of the cell a record of `kind` holds at the stamped word `word`. */
	#cellPlace(kind: number, word: number): Extract<BuiltPlaceRow, { readonly length: 6 }> {
		const place = this.#placesOf(kind).find((row): row is Extract<BuiltPlaceRow, { readonly length: 6 }> => row.length === 6 && row[0] === word);
		if (place === undefined) throw new Error(`a kind ${kind} record holds no cell at word ${word}, so a site there names no unit`);
		return place;
	}

	/** Whether the cell `place` names in the built record at `at`, at `item` of a list, is a unit's. */
	#holdsUnit(at: number, place: Extract<BuiltPlaceRow, { readonly length: 6 }>, item: number): boolean {
		const [, built, , , run] = place;
		const cell = this.words(at, built + 1)[wordOf(at, this.format) + built]!;
		if (run === 0) return item === 0 && decodeBuiltCell(this, cell).form === 'unit';
		const list = decodeListCell(this, cell);
		return item < list.len && decodeBuiltCell(this, this.words(list.run, list.len)[wordOf(list.run, this.format) + item]!).form === 'unit';
	}

	/** The handle of the compound record at `at`. */
	node(at: number): object {
		return this.reads(at) ? this.#readView(at, undefined) : this.#view(at, this.kindAt(at));
	}

	/** The text `span` covers in the source the read's record at `node` was read from, `known` that source's entry when its caller already has it. */
	readText(node: number, span: { readonly start: number; readonly end: number }, known?: number): string {
		if (known !== undefined && (this.#readChunk(chunkOf(node, this.format))?.length ?? 0) === 0) throw new Error(releasedRecord(node));
		const source = known ?? this.sourceOf(node);
		const chunk = chunkOf(source, this.format);
		const bytes = this.#readBytes(chunk);
		if (bytes === undefined || bytes.length === 0) throw new Error(releasedRecord(node));
		const at = wordOf(source, this.format);
		const text = at + this.format.sourceEntry.headBytes;
		const len = byteWord(bytes, at);
		const { start, end } = span;
		const texts = (this.#sourceTexts[chunk] ??= new Map());
		let whole = texts.get(source);
		if (whole === undefined) {
			const decoded = decoder.decode(bytes.subarray(text, text + len));
			whole = decoded.length === len ? decoded : null;
			texts.set(source, whole);
		}
		if (whole !== null) {
			if (!(start <= end && end <= len)) throw new Error(`${start}..${end} is not a span of the source of the record at ${node}`);
			return whole.slice(start, end);
		}
		const boundary = (n: number): boolean => n === len || (bytes[text + n]! & 0xc0) !== 0x80;
		if (!(start <= end && end <= len && boundary(start) && boundary(end))) throw new Error(`${start}..${end} is not a span of the source of the record at ${node}`);
		return decoder.decode(bytes.subarray(text + start, text + end));
	}

	/** The address of the source entry the read's record at `at` was read from. */
	sourceOf(at: number): number {
		const side = sideUnderRows(this, this.words(at, 2)[wordOf(at, this.format) + 1]!);
		const source = side === 0 ? undefined : decodeSideSource(this.words(side, 1), wordOf(side, this.format), this.format);
		if (source === undefined) throw new Error(`the record at ${at} names no source, so no read wrote it`);
		return source;
	}

	/** The node a read left that `name` names past a call: the handle of its record, or, for a node a cell of the record names, its read data. */
	named(name: { readonly $node: number; readonly $site?: CellSite; readonly $span: { readonly start: number; readonly end: number }; readonly $type: number }): unknown {
		return name.$site === undefined ? this.node(name.$node) : readLeaf(this, name.$node, name.$type, name.$span, name.$site);
	}

	#readView(at: number, errors: readonly unknown[] | undefined): object {
		const position = { ...readPosition(this.tree, at), $errors: errors };
		return keepExemplar(this.#exemplars, wrapRegistered(position, this.tree, this.#wrap as (data: object, tree: TreeHandle) => object));
	}

	/** The root of `source`, parsed: a handle on the record its read left in this arena, with the source's error regions as `$errors`. No tree outlives the call. */
	parse(source: string, options?: ParseOptions): object {
		const { root, errors, source: entry } = this.#parse(source, options);
		if (root === null) throw new Error("the source's root has no record, so the arena holds no node of it");
		this.#roots.set(root, entry);
		if (this.#commits.length > 0) this.#recordMinted(root, this.#chunk(root, 1));
		const regions = Object.freeze(errors);
		if (regions.length > 0) this.#errors.set(entry, regions);
		const view = this.#readView(root, regions);
		if (!isRecordPosition(view)) this.#holdRootWithoutView(view, root);
		return view;
	}

	#holdRootWithoutView(view: object, at: number): void {
		this.#rootsWithoutView.set(view, at);
		Object.defineProperty(view, Symbol.dispose, { configurable: true, value: () => this.releaseHandle(view) });
	}

	holdsRootWithoutView(node: object): boolean {
		return this.#rootsWithoutView.has(node);
	}

	/** The ERROR and MISSING regions of the parse that left the node the key `node` names (`coordinateIndex`): none for a parse that had none. */
	errorsOf(node: number): readonly unknown[] {
		if (this.#errors.size === 0) return NO_ERRORS;
		return this.#errors.get(this.sourceOf(keyName(node, this.format.nodeId).node)) ?? NO_ERRORS;
	}

	withOf(kind: number): BuiltWith | undefined {
		return this.#views.withs[kind];
	}

	#widthOf(kind: number): number {
		const words = this.#views.words[kind];
		if (words === undefined) throw new Error(`no builder writes records of kind ${kind}, so the arena has no width for one`);
		return words;
	}

	/** The built record `node` is, naming the node a read left in this arena that the key `key` names, spanning `span`, as the one it was rebuilt from: in place when `own` and only its handle holds it, else as a copy. */
	rebuiltFromRead(node: object, key: number, span: { readonly start: number; readonly end: number }, own: boolean): object {
		const { node: holder, site } = keyName(key, this.format.nodeId);
		return this.#rebuilt(node, [holder, site, 0, span.start, span.end], own);
	}

	/** Whether the read's record at `at` is the root of its source. */
	isRoot(at: number): boolean {
		return this.#roots.has(at);
	}

	#rebuilt(node: object, naming: readonly number[], own: boolean): object {
		const at = builtRecordOf(node, this);
		if (at === undefined) throw new Error('only a record this arena built is rebuilt from a parsed node');
		if (own && this.#heldOnlyByHandle(at)) {
			const words = this.#chunk(at, 2);
			const head = wordOf(at, this.format);
			const side = words[head + 1]!;
			words[head + 1] = this.#sidesNaming(side, naming, true);
			if (side !== 0) this.drop(side, this.format.held.side);
			return node;
		}
		return this.scope(() => {
			const kind = this.kindAt(at);
			const record = this.record(kind);
			record.data[record.base + 1] = this.#sidesNaming(this.words(at, 2)[wordOf(at, this.format) + 1]!, naming, false);
			this.#copyCells(at, kind, record, false);
			this.#copySites(at, record.at, []);
			const last = this.#placedLast;
			if (own && last?.node === node) for (let n = 0; n < last.placed.length; n += 3) moveLeafSite(last.placed[n] as object, at, record.at, last.placed[n + 1] as number, last.placed[n + 2] as number);
			return this.#view(record.at, kind, record.data);
		});
	}

	#heldOnlyByHandle(at: number): boolean {
		const { counts, index } = this.#countAt(at);
		return counts[index] === (this.format.countOwned | 1);
	}

	#sidesNaming(side: number, sides: readonly number[], keepRows: boolean): number {
		const under = sideUnderRows(this, side);
		const named = this.#baseNaming(under, sides);
		return keepRows && under !== side ? this.#rowsOver(side, named) : named;
	}

	#rowsOver(rows: number, under: number): number {
		const fields = this.format.sideRows;
		const start = wordOf(rows, this.format);
		const mask = this.#chunk(rows, 1)[start]!;
		const own = [fields.leading, fields.trailing, fields.inner].filter((bit) => (mask & bit) !== 0).length;
		const after = (mask & fields.next) === 0 ? 1 : 2;
		const sites = (mask & fields.sites) === 0 ? 0 : 1 + this.#chunk(rows, after + own + 1)[start + after + own]! * fields.siteWords;
		const cells = Array.from(this.#chunk(rows, after + own + sites).subarray(start + after, start + after + own + sites));
		for (let n = 0; n < own; n++) this.holdCell(cells[n]!);
		for (let n = own + 2; n < cells.length; n += fields.siteWords) this.holdCell(cells[n]!);
		return this.push(under === 0 ? [(mask & ~fields.next) >>> 0, ...cells] : [(mask | fields.next) >>> 0, under, ...cells], 1);
	}

	#baseNaming(side: number, sides: readonly number[]): number {
		const { sideBeforeDelimiter, sideSides, sideDelimiter, sideSeparatorKind } = this.format;
		this.hold(sides[0]!);
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
	linkedLeaf({ kind, holder, site, span }: { readonly kind: number; readonly holder: number; readonly site: CellSite | undefined; readonly span: { readonly start: number; readonly end: number } }): object {
		const leaf = readLeaf(this, holder, kind, span, site);
		return site === undefined ? wrapRegistered(leaf, this.tree, this.#wrap as (data: object, tree: TreeHandle) => object, 'aliasContent') : leaf;
	}
}

export interface BuiltEntry {
	readonly $type: number;
	readonly $record: number;
}

export function isBuiltEntry(entry: unknown): entry is BuiltEntry {
	return typeof entry === 'object' && entry !== null && typeof (entry as Partial<BuiltEntry>).$record === 'number';
}

type ReadName = Parameters<BuiltArena['named']>[0];

function isReadName(entry: unknown): entry is ReadName {
	return typeof entry === 'object' && entry !== null && typeof (entry as { readonly $node?: unknown }).$node === 'number';
}

export function builtEntries(entries: readonly WireNode[], table: object): WireNode[] {
	const built = (table as Partial<TreeHandle>).built;
	const node = (entry: WireNode): object | undefined =>
		isBuiltEntry(entry) ? builtEntryNode(entry, table) : built === undefined ? undefined : isTextData(entry) ? built.textNode(entry) : isReadName(entry) ? (built.named(entry) as object) : undefined;
	if (!entries.some((entry) => isBuiltEntry(entry) || (built !== undefined && (isTextData(entry) || isReadName(entry))))) return entries as WireNode[];
	return entries.map((entry) => node(entry) ?? entry);
}

type TextData = { readonly $type: number; readonly $text: string };

function isTextData(entry: unknown): entry is TextData {
	return typeof entry === 'object' && entry !== null && typeof (entry as Partial<TextData>).$type === 'number' && typeof (entry as Partial<TextData>).$text === 'string';
}

export function readEntries(table: object, entries: readonly WireNode[]): WireNode[] {
	for (const entry of entries) if (isCoordinate(entry) && !isReadName(entry)) readCoordinate(table, entry);
	return builtEntries(entries, table);
}

export function readOwnEntries(table: object, entries: readonly WireNode<ReadOutput>[], own: TreeToken): WireNode[] {
	for (const entry of entries) {
		if (isCoordinate(entry)) readCoordinate(table, entry, own);
		else if (typeof entry === 'object' && !isBuiltEntry(entry)) holdReadTree(entry, own);
	}
	return builtEntries(entries, table);
}

export function readCoordinate(table: object, coordinate: NodeCoordinate, own?: TreeToken): NodeCoordinate {
	const token = heldTree(table, decodeTree(coordinate.$treeHandle), own);
	if (token !== undefined) holdReadCoordinate(coordinate, token);
	return coordinate;
}

export function readUnits(table: object, units: readonly UnitSidesWire[]): UnitSidesWire[] {
	return units.map((unit) => ({ ...unit, ...mapTriviaEntries(unit, (entries) => readEntries(table, entries)) }));
}

export function readOwnUnits(table: object, units: readonly UnitSidesWire<ReadOutput>[], own: TreeToken): UnitSidesWire[] {
	return units.map((unit) => ({ ...unit, ...mapTriviaEntries(unit, (entries) => readOwnEntries(table, entries, own)) }));
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

interface KeptEntry {
	readonly cell: number;
	readonly layout?: number;
	readonly counted: boolean;
}

type KeptForm = { readonly form: 'layout'; readonly kind: number } | { readonly form: 'record'; readonly at: number; readonly adopt: boolean } | { readonly form: 'text'; readonly kind: number; readonly text: string };

const NO_INSIDE = 'a record writer does not write an inner side on a node with no record, which has no inside';
const READ_SIDE = "a record writer does not write a side of a read's node, which its read's list of replaced ranges holds";
const NOT_EMPTY = 'a record writer does not write an inner side on a node that is not empty, whose trivia is its children\'s sides';
const RECORD_ZERO = 'record address 0 is not one a record writer writes';
const TRIVIA_SIDE_NAMES = ['leading', 'trailing', 'inner'] as const;

/** How a side holds the wire `entry` (`BuiltArena.#keptEntries`). */
function keptForm(entry: WireNode, arena: BuiltArena): KeptForm {
	if (typeof entry === 'number') return { form: 'layout', kind: entry };
	const value = entry as { readonly $type?: unknown; readonly $record?: unknown; readonly $node?: unknown; readonly $site?: unknown; readonly $text?: unknown };
	if (typeof value.$record === 'number') return { form: 'record', at: value.$record, adopt: true };
	if (typeof value.$node === 'number') {
		if (value.$site !== undefined || typeof value.$type !== 'number' || !arena.reads(value.$node)) throw new Error('a record writer does not write a coordinate in a side naming no record a read left');
		return { form: 'record', at: value.$node, adopt: false };
	}
	if (typeof value.$type === 'number' && typeof value.$text === 'string') return { form: 'text', kind: value.$type, text: value.$text };
	throw new Error('a record writer does not write a trivia value written as no record, layout member or leaf entry');
}

interface EditableRows {
	next: number;
	leading: number | undefined;
	trailing: number | undefined;
	inner: number | undefined;
	sites: (readonly [key: number, cell: number])[];
}

function editableRows(rows: SideRows | undefined): EditableRows {
	return rows === undefined ? { next: 0, leading: undefined, trailing: undefined, inner: undefined, sites: [] } : { ...rows, sites: [...rows.sites] };
}

function holdsRows(rows: SideRows): boolean {
	return rows.leading !== undefined || rows.trailing !== undefined || rows.inner !== undefined || rows.sites.length > 0;
}

/** Each row's list cell, its own sides' then its sites', empty rows among them. */
function rowCells(rows: SideRows): number[] {
	return [rows.leading, rows.trailing, rows.inner].filter((cell): cell is number => cell !== undefined).concat(rows.sites.map(([, cell]) => cell));
}

function rowAt(rows: SideRows, slot: TriviaSideName | number): number | undefined {
	return typeof slot === 'number' ? rows.sites.find(([key]) => key === slot)?.[1] : rows[slot];
}

/** `rows` holds `cell` as the row of `slot`, or none; sites stay in key order. */
function setRowAt(rows: EditableRows, slot: TriviaSideName | number, cell: number | undefined): void {
	if (typeof slot !== 'number') {
		rows[slot] = cell;
		return;
	}
	const at = rows.sites.findIndex(([key]) => key >= slot);
	const found = at !== -1 && rows.sites[at]![0] === slot;
	if (cell === undefined) {
		if (found) rows.sites.splice(at, 1);
		return;
	}
	if (found) rows.sites[at] = [slot, cell];
	else rows.sites.splice(at === -1 ? rows.sites.length : at, 0, [slot, cell]);
}

export function sideEntryOf(entry: object, arena: BuiltArena | undefined, holder: EngineIdentity | undefined): BuiltEntry | NodeCoordinate | undefined {
	refuseForeignEntry(entry, holder);
	if (arena === undefined && isBuiltNode(entry)) throw new Error(NO_RECORDS);
	const built = recordRefOf(entry);
	if (built === undefined) return unreadRecordOf(entry, arena) ?? readCoordinateOf(entry);
	if (built.arena !== arena) throw new Error(OTHER_ENGINE_RECORD);
	built.arena.refuseReleased(built.at);
	if (!built.arena.reads(built.at)) built.arena.settle();
	return { $type: (entry as { readonly $type: number }).$type, $record: built.at };
}

function unreadRecordOf(entry: object, arena: BuiltArena | undefined): BuiltEntry | undefined {
	const at = coordinateOf(entry) as { readonly $node?: number; readonly $site?: CellSite } | undefined;
	if (arena === undefined || at?.$node === undefined || at.$site !== undefined || treeOf(entry)?.built !== arena) return undefined;
	return { $type: (entry as { readonly $type: number }).$type, $record: at.$node };
}

export function refuseForeignEntry(entry: object, holder: EngineIdentity | undefined): void {
	const engine = builtArenaOf(entry)?.engine() ?? engineOf(entry);
	if (engine === undefined || holder === undefined || sameLanguage(engine, holder)) return;
	throw new Error(`cannot write a ${engine.language.name} ${isBuiltNode(entry) && !isRead(entry) ? 'record' : 'node'} into a side of a ${holder.language.name} node`);
}

function readCoordinateOf(entry: object): NodeCoordinate | undefined {
	return isRead(entry) && sourceOf(entry) === Source.Ts ? coordinateOf(entry) : undefined;
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
	return handleArenaOf(value) !== undefined;
}

export function builtArenaOf(value: object): BuiltArena | undefined {
	return handleArenaOf(value);
}

export function builtRecordOf(value: object, arena: BuiltArena): number | undefined {
	const own = handleArenaOf(value);
	if (own === undefined) return undefined;
	const at = liveRecordAt(value, own);
	return own === arena && at !== undefined && !own.reads(at) ? at : undefined;
}

/** The built cell naming `at`, a record or a leaf entry, with the edges `changed` its site marks. */
export function builtCell(at: number, changed = 0): number {
	if (at >= 2 ** 30) throw new Error(`a built cell holds addresses below 2^30, not ${at}`);
	return at * 4 + changed;
}

/** The built cell of a unit of `kind`: an address in chunk 0, whose word is the kind; the blank arm's is the reserved offset. */
export function unitCell(kind: number, format: CellFormat): number {
	if (checkedKindId(kind) === BLANK_KIND_ID) return format.blankUnit * 4;
	if (kind >= format.blankUnit) throw new Error(`a unit cell holds kinds below ${format.blankUnit}, not ${kind}`);
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
		const kind = wordOf(at, arena.format);
		return { form: 'unit', kind: kind === arena.format.blankUnit ? BLANK_KIND_ID : kind, row: undefined };
	}
	const { linkFlag, linkWords } = arena.format;
	if (arena.holdsRecords(chunk)) {
		const words = arena.words(at, 1);
		const start = wordOf(at, arena.format);
		const { kind, flags } = headerOf(words[start]!, arena.format);
		if (flags === 0) return { form: 'child', kind, at, changed };
		if (flags !== linkFlag) throw new Error(`a built record header holds flags ${flags}, which no builder writes`);
		const link = arena.words(at, linkWords);
		if (link[start + 5]! !== 0) throw new Error(`the link record at ${at} names a record of a tree, which no builder writes`);
		const word = link[start + 3]!;
		return { form: 'linkedLeaf', kind, at, holder: link[start + 2]!, site: word === 0 ? undefined : [word, link[start + 4]!], span: { start: link[start + 6]!, end: link[start + 7]! }, changed };
	}
	const { kind, len } = arena.entryAt(at);
	if (kind === 0) return { form: 'builtText', offset: at, len };
	return { form: 'builtLeaf', kind, offset: at, len, changed };
}

/** Writes the cell at `cell` of the drafted `record`, its slot `word`, holding `value`. */
export function storeCell(arena: BuiltArena, record: BuiltDraft, cell: number, word: number, value: unknown): void {
	record.data[record.base + cell] = cellOf(arena, value, record, word, 0);
}

function cellOf(arena: BuiltArena, value: unknown, record: BuiltDraft, word: number, item: number): number {
	if (value === undefined || value === null) return 0;
	if (typeof value === 'number') return unitCell(value, arena.format);
	if (typeof value === 'string') {
		const entry = arena.entry(0, value);
		arena.holdText(entry.at);
		return builtCell(entry.at);
	}
	const ref = builtRefOf(value);
	if (ref === undefined && typeof value === 'object') return parsedCell(arena, value);
	if (ref !== undefined && ref.arena !== arena && isRead(value as object)) throw new Error(otherEngineParsed((value as { readonly $type?: unknown }).$type));
	if (ref === undefined || ref.arena !== arena) throw new Error(`a built record holds only nodes its own engine built, not ${foreignValue(value, ref)}`);
	if (ref.at !== undefined) {
		arena.adopt(ref.at);
		return builtCell(ref.at);
	}
	const entry = arena.placeEntry(value as object, (value as { readonly $type: number }).$type, ref.text);
	arena.holdText(entry.at);
	(record.placed ??= []).push(value, word, item);
	return builtCell(entry.at);
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
function parsedCell(arena: BuiltArena, value: object): number {
	const coordinate = isCoordinate(value) ? value : coordinateOf(value);
	const named = coordinate as { readonly $node?: number; readonly $site?: CellSite; readonly $type?: number } | undefined;
	if (coordinate !== undefined && named?.$node !== undefined) {
		if (treeOf(value)?.built !== arena) throw new Error(otherEngineParsed((value as { readonly $type?: unknown }).$type ?? named.$type));
		const kind = (value as { readonly $type?: unknown }).$type;
		if (named.$site === undefined && (typeof kind !== 'number' || kind === arena.kindAt(named.$node))) return builtCell(named.$node);
		return builtCell(arena.linkRow(typeof kind === 'number' ? kind : named.$type!, named.$node, named.$site, coordinate.$span));
	}
	throw new Error(`a built record holds only nodes its own engine built or parsed, not ${foreignValue(value, undefined)}`);
}

function otherEngineParsed(kind: unknown): string {
	return `a built record holds only nodes its own engine built or parsed, not a node of kind ${String(kind)} another engine parsed`;
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
	for (let item = 2 ** arena.format.nodeId.itemBits; item < items.length; item++) if (builtLeafOf(items[item]) !== undefined) throw new Error(leafItemPastNames(item, arena.format.nodeId));
	const run = arena.run(items.length);
	record.data[record.base + cell] = builtCell(run.at);
	for (let n = 0; n < items.length; n++) run.data[run.base + 1 + n] = cellOf(arena, items[n], record, word, n);
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
	if (keptAt(record, word, value)) return arena.keep(record, word);
	patchedAt(arena, record, cell, word, false);
	storeCell(arena, record, cell, word, value);
}

export function patchList(arena: BuiltArena, record: BuiltDraft, cell: number, word: number, items: readonly unknown[]): void {
	const kept = record.kept?.[word];
	if (Array.isArray(kept) && kept.length === items.length && items.every((item, n) => item === kept[n])) {
		if (record.copyOfParsed !== undefined) storeList(arena, record, cell, word, items);
		return;
	}
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
