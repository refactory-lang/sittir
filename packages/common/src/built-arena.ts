import type { EngineIdentity, NodeCoordinate } from '@sittir/types';
import { bindTree, engineOf, sameLanguage, treeBuiltArena, type TreeEngineHandle } from './engine-scope.ts';
import { wrapRegistered, type Role } from './identity.ts';
import { changedEdges, coordinateOf, holdReadTree, isRead, isRebuilt, NO_EDGES, type ChangedEdges, type KindView } from './node-data.ts';
import { decodeIndex, decodeTree, isCoordinate } from './read.ts';
import { treeOf, treeTokenOf, type TreeToken } from './tree-token.ts';
import type { RecordReader, TreeHandle, TriviaSideName } from './read.ts';
import { addressOf, chunkOf, wordOf, type CellFormat, type RecordCell } from './record-cell.ts';
import { builtRefOf, packSite, placeLeaf, type BuiltRecordRef, type BuiltRef } from './built-ref.ts';
import { leafData, recordDelimiter, recordOf, recordSeparator, recordStub } from './record-view.ts';
import type { LeafMaker, RecordPosition } from './handle.ts';
import { forEachTriviaList, mapTriviaEntries, type TriviaSides } from './trivia.ts';

/** Text a built arena interned: its UTF-8 bytes' packed offset in the arena's string chunks and their length. */
export interface BuiltText {
	readonly at: number;
	readonly len: number;
}

export interface BuiltWords {
	readonly data: Uint32Array;
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
	readonly words: readonly Uint32Array[];
	readonly bytes: readonly Uint8Array[];
}

export interface BuiltChunk<A extends Uint32Array | Uint8Array> {
	readonly chunk: number;
	readonly data: A;
}

export interface BuiltRecords {
	readonly format: CellFormat;
	readonly owner: object;
	readonly kinds: KindView;
	words(length: number): BuiltChunk<Uint32Array>;
	bytes(length: number): BuiltChunk<Uint8Array>;
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
const EMPTY_RUN: BuiltPlace = Object.freeze({ data: new Uint32Array(0), base: 0, at: 0, words: 0 });
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

function units(size: number, least: number): void {
	if (!Number.isSafeInteger(size) || size < least) throw new Error(`a built arena cannot allocate ${size} units`);
}

class Chunks<A extends Uint32Array | Uint8Array> {
	readonly #make: (length: number) => BuiltChunk<A>;
	readonly #first: number;
	readonly #limit: number;
	readonly #most: number;
	readonly chunks: A[] = [];
	readonly used: number[] = [];
	#open = -1;

	constructor(make: (length: number) => BuiltChunk<A>, first: number, format: CellFormat) {
		this.#make = make;
		this.#limit = 2 ** format.chunkShift;
		this.#most = 2 ** (32 - format.chunkShift);
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
		if (this.chunks.length >= this.#most) throw new Error('a built arena holds as many chunks as an address can name');
		const { chunk, data } = this.#make(length);
		if (chunk !== this.chunks.length) throw new Error(`a built arena's chunk ${this.chunks.length} came back as chunk ${chunk}`);
		this.chunks.push(data);
		this.used.push(0);
		return chunk;
	}

	/** Gives back the unwritten tail of the last allocation in `chunk`, so `used` units of it stay written. */
	trim(chunk: number, used: number): void {
		this.used[chunk] = used;
	}

	holds(chunk: number, unit: number, length: number): boolean {
		return chunk < this.chunks.length && unit + length <= this.used[chunk]!;
	}
}

const SIDE_BITS: Readonly<Record<TriviaSideName, number>> = { leading: 1, trailing: 2, inner: 4 };
const sideHolds = new WeakMap<object, Map<string, readonly TreeToken[]>>();
const NO_RECORDS = 'a side names a built record, and its engine builds no records';
const OTHER_ENGINE_RECORD = "cannot write another engine's record into a side: a side holds only records its holder's engine built";

export type BuiltWith = (node: object, name: string, args: readonly unknown[]) => unknown;

export interface BuiltViews {
	readonly withs: Readonly<Record<number, BuiltWith>>;
	readonly words: Readonly<Record<number, number>>;
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
	readonly #words: Chunks<Uint32Array>;
	#drafts = new Uint32Array(DRAFT_WORDS);
	#drafted = 0;
	readonly #bytes: Chunks<Uint8Array>;
	readonly #textByValue = new Map<string, BuiltText>();
	readonly #textByAt = new Map<number, { readonly value: string; readonly len: number }>();
	readonly #trees = new Map<number, { readonly tree: TreeHandle; readonly token: TreeToken }>();
	readonly #sided = new Map<number, number>();
	readonly #unitSided = new Set<number>();
	readonly #leafSited = new Set<number>();
	readonly #trivia: BuiltRecords['trivia'];
	readonly #writeLeafSites: WriteLeafSites;

	constructor({ format, owner, kinds, words, bytes, trivia }: BuiltRecords, wrap: Wrap, handle: TreeEngineHandle, views: BuiltViews, writeLeafSites: WriteLeafSites) {
		this.format = format;
		this.owner = owner;
		this.kinds = kinds;
		this.#wrap = wrap;
		this.#handle = handle;
		this.#views = views;
		this.#trivia = trivia;
		this.#writeLeafSites = writeLeafSites;
		this.tree = {
			built: this,
			triviaSide: (at, side) => {
				if (((this.#sided.get(at) ?? 0) & SIDE_BITS[side]) === 0) return undefined;
				const entries = trivia.triviaSide(at, side);
				return entries === undefined ? undefined : readEntries(this.tree, entries);
			},
			writeTriviaSide: (at, side, entries) => {
				trivia.writeTriviaSide(at, side, entries);
				this.#sided.set(at, (this.#sided.get(at) ?? 0) | SIDE_BITS[side]);
			},
			unitSides: (at) => (this.#unitSided.has(at) ? readUnits(this.tree, trivia.unitSides(at)) : []),
			writeUnitSides: (at, units) => {
				trivia.writeUnitSides(at, units);
				this.#unitSided.add(at);
			}
		};
		bindTree(this.tree, handle);
		this.#words = new Chunks(words, FIRST_CHUNK_WORDS, format);
		this.#bytes = new Chunks(bytes, FIRST_STRING_BYTES, format);
		this.#words.alloc(1);
	}

	get engine(): EngineIdentity {
		return this.#handle.current;
	}

	#place(size: number): BuiltPlace {
		const { chunk, word, data } = this.#words.alloc(size);
		return { data, base: word, at: addressOf(chunk, word, this.format), words: size };
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
		this.#drafts[draft.base] = kind;
		this.#drafted += words;
		return draft;
	}

	copy(source: object, kind: number): BuiltDraft {
		const at = builtRecordOf(source, this);
		if (at === undefined) return this.record(kind);
		const head = wordOf(at, this.format);
		const words = this.#widthOf(kind);
		const found = this.words(at, 1)[head]!;
		if (found !== kind) throw new Error(`a $with of a kind ${kind} record was handed a record of kind ${found}`);
		const draft = this.draft(kind, words, at, (source as { readonly $cache?: Readonly<Record<number, unknown>> }).$cache ?? {});
		draft.data.set(this.words(at, words).subarray(head, head + words), draft.base);
		return draft;
	}

	#header(kind: number, words: number): BuiltPlace {
		const place = this.#place(words);
		place.data[place.base] = kind;
		return place;
	}

	/** The words of a run of `length` cells, `stride` words each, zeroed; address 0 for an empty run. */
	run(length: number, stride: number): BuiltPlace {
		return length === 0 ? EMPTY_RUN : this.#place(length * stride);
	}

	/** `words` written at a fresh address: a side record. */
	push(words: readonly number[]): number {
		const place = this.#place(words.length);
		place.data.set(words, place.base);
		return place.at;
	}

	/** `value` interned: every call with equal text returns the same reference, and empty text takes no bytes. */
	text(value: string): BuiltText {
		const known = this.#textByValue.get(value);
		if (known !== undefined) return known;
		let text: BuiltText = { at: 0, len: 0 };
		if (value.length > 0) {
			const target = this.#bytes.alloc(value.length * 3);
			const { written } = encoder.encodeInto(value, target.data.subarray(target.word));
			this.#bytes.trim(target.chunk, target.word + written);
			text = { at: addressOf(target.chunk, target.word, this.format), len: written };
			this.#textByAt.set(text.at, { value, len: written });
		}
		this.#textByValue.set(value, text);
		return text;
	}

	/** The text a cell's offset and length name: the string interned there, else its bytes decoded. */
	textOf(at: number, len: number): string {
		if (len === 0) return '';
		const known = this.#textByAt.get(at);
		if (known?.len === len) return known.value;
		const chunk = chunkOf(at, this.format);
		const start = wordOf(at, this.format);
		if (!this.#bytes.holds(chunk, start, len)) {
			throw new Error(`a built cell names text past its arena's bytes (offset ${at}, ${len} bytes)`);
		}
		return decoder.decode(this.#bytes.chunks[chunk]!.subarray(start, start + len));
	}

	/** The chunk `at` lies in, `length` words from `at` of it written. */
	words(at: number, length: number): Uint32Array {
		const chunk = chunkOf(at, this.format);
		if (!this.#words.holds(chunk, wordOf(at, this.format), length)) {
			throw new Error(`a built record read runs past its arena's words (address ${at}, ${length} words)`);
		}
		return this.#words.chunks[chunk]!;
	}

	chunks(): BuiltChunks {
		const cut = <A extends Uint32Array | Uint8Array>(table: Chunks<A>): A[] =>
			table.chunks.map((chunk, n) => chunk.subarray(0, table.used[n]) as A);
		return { words: cut(this.#words), bytes: cut(this.#bytes) };
	}

	#view(at: number): object {
		const position: RecordPosition = { $type: this.words(at, 1)[wordOf(at, this.format)]!, $tree: this.tree, $at: at, $_layout: undefined };
		return this.#wrap(position, this.tree) as object;
	}

	/** The handle of the drafted `record`, placed past every record its cells name. Each built leaf it holds is placed at its site there. */
	view(record: BuiltDraft): object {
		const place = this.#place(record.words);
		place.data.set(record.data.subarray(record.base, record.base + record.words), place.base);
		const placed = record.placed;
		for (let n = 0; placed !== undefined && n < placed.length; n += 3) this.#site(placed[n] as object, place.at, placed[n + 1] as number, placed[n + 2] as number);
		if (record.copyOf !== undefined) this.#copySites(record.copyOf, place.at, record.patched ?? []);
		return this.#view(place.at);
	}

	/** A leaf of text `text` made by `maker`, as a built leaf of this arena: it has no record. */
	leaf(maker: LeafMaker, text: string): object {
		return maker(this.tree, this.text(text), undefined);
	}

	/**
	 * The handle of the built leaf of `kind` whose text is `entry`, at its site in the record at `holder`.
	 *
	 * @throws For a kind no builder writes leaves of.
	 */
	leafAt(kind: number, entry: BuiltText, holder: number, word: number, item: number): object {
		const maker = this.#views.leaves[kind];
		if (maker === undefined) throw new Error(`no builder writes leaves of kind ${kind}, so the arena has no leaf handle for one`);
		return maker(this.tree, entry, packSite(holder, word, item));
	}

	#site(leaf: object, holder: number, word: number, item: number): void {
		placeLeaf(leaf, holder, word, item);
		this.#writeLeafSites(leaf, [holder, word, item]);
	}

	/** Replaces `side` of the built leaf at each site `sites` names, `[holder, word, item]` after another, with `entries`. */
	writeLeafSide(sites: readonly number[], side: TriviaSideName, entries: readonly unknown[]): void {
		this.#trivia.writeLeafSide(sites, side, entries);
		for (let n = 0; n < sites.length; n += 3) this.#leafSited.add(sites[n]!);
	}

	/** The entries a write gave `side` of the built leaf at the site `holder`, `word`, `item`, `undefined` for none. */
	leafSide(holder: number, word: number, item: number, side: TriviaSideName): unknown[] | undefined {
		if (!this.#leafSited.has(holder)) return undefined;
		const entries = this.#trivia.leafSide(holder, word, item, side);
		return entries === undefined ? undefined : readEntries(this.tree, entries);
	}

	#copySites(from: number, to: number, skip: readonly number[]): void {
		const units = this.#unitSided.has(from);
		const leaves = this.#leafSited.has(from);
		if (!units && !leaves) return;
		this.#trivia.copySites(from, to, skip);
		if (units) this.#unitSided.add(to);
		if (leaves) this.#leafSited.add(to);
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

	/** Holds the parsed tree `tree`, which a record of this arena names, with its `token`, for as long as the arena lives. */
	hold(tree: TreeHandle & { readonly id: number }, token: TreeToken): void {
		this.#trees.set(tree.id, { tree, token });
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
		this.hold(tree, token);
		const head = wordOf(at, this.format);
		const header = this.words(at, 2);
		const words = this.#widthOf(header[head]!);
		const side = this.#sidesNaming(header[head + 1]!, [tree.id, index, end, span.start, span.end]);
		const place = this.#place(words);
		place.data.set(this.words(at, words).subarray(head, head + words), place.base);
		place.data[place.base + 1] = side;
		this.#copySites(at, place.at, []);
		return this.#view(place.at);
	}

	#sidesNaming(side: number, sides: readonly number[]): number {
		const { sideBeforeDelimiter, sideSides, sideDelimiter, sideSeparatorKind } = this.format;
		if (side === 0) return this.push([sideSides.bit, ...sides]);
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
		const words = Array.from(this.words(side, length).subarray(start, start + length));
		words.splice(offset, (mask & sideSides.bit) === 0 ? 0 : sideSides.words, ...sides);
		words[0] = mask | sideSides.bit;
		return this.push(words);
	}

	parsedLeaf(kind: number, tree: number, index: number, end: number, span: { readonly start: number; readonly end: number }, changed: ChangedEdges): number {
		const record = this.#header(kind, 2);
		const { sideSides, sideChanged } = this.format;
		const mask = sideSides.bit | (changed.leading ? sideChanged.leading : 0) | (changed.trailing ? sideChanged.trailing : 0);
		record.data[record.base + 1] = this.push([mask, tree, index, end, span.start, span.end]);
		return record.at;
	}

	/** The parsed leaf a copied leaf's record names, as its tree's own view of it. */
	copiedLeaf({ kind, record }: { readonly kind: number; readonly record: number }): object {
		const side = this.words(record, 2)[wordOf(record, this.format) + 1]!;
		const words = side === 0 ? undefined : this.words(side, 1 + this.format.sideSides.words);
		const at = side === 0 ? 0 : wordOf(side, this.format);
		if (words === undefined || words[at] !== this.format.sideSides.bit) throw new Error(`a copied leaf's record ${record} names no parsed leaf`);
		const held = this.#trees.get(words[at + 1]!);
		if (held === undefined) throw new Error(`a built record holds a leaf of parsed tree ${words[at + 1]}, which its arena does not hold`);
		const row = words[at + 2]!;
		const data = leafData(held.tree, kind, { start: words[at + 4]!, end: words[at + 5]! }, row);
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

function writeChild(words: Uint32Array | number[], at: number, format: CellFormat, kind: number, address: number, link: number, changed: number): void {
	words[at] = format.child;
	words[at + 1] = kind;
	words[at + 2] = address;
	words[at + 3] = link;
	words[at + 4] = changed;
}

function writeUnit(words: Uint32Array | number[], at: number, format: CellFormat, kind: number, row: number): void {
	words[at] = format.unit;
	words[at + 1] = kind;
	words[at + 2] = row;
}

function writeBuiltLeaf(words: Uint32Array | number[], at: number, format: CellFormat, kind: number, text: BuiltText, changed: number): void {
	words[at] = format.builtLeaf;
	words[at + 1] = kind;
	words[at + 2] = text.at;
	words[at + 3] = text.len;
	words[at + 4] = changed;
}

function writeCopiedLeaf(words: Uint32Array | number[], at: number, format: CellFormat, kind: number, text: BuiltText, record: number): void {
	words[at] = format.copiedLeaf;
	words[at + 1] = kind;
	words[at + 2] = text.at;
	words[at + 3] = text.len;
	words[at + 4] = record;
}

function writeBuiltText(words: Uint32Array | number[], at: number, format: CellFormat, text: BuiltText): void {
	words[at] = format.builtLeaf;
	words[at + 1] = 0;
	words[at + 2] = text.at;
	words[at + 3] = text.len;
}

/**
 * Writes `cell` into `words` at `at` as the native codec does, the inverse of `decodeCell`. A writer writes into a
 * fresh record, so the words it leaves are already zero.
 *
 * @throws For a form only a parsed tree's reader writes.
 */
export function encodeCell(words: Uint32Array | number[], at: number, format: CellFormat, cell: RecordCell): void {
	switch (cell.form) {
		case 'absent':
			words[at] = format.absent;
			return;
		case 'child':
			writeChild(words, at, format, cell.kind, cell.at, cell.link === undefined ? 0 : cell.link + 1, changedWord(cell.changed));
			return;
		case 'unit':
			writeUnit(words, at, format, cell.kind, cell.row === undefined ? 0 : cell.row + 1);
			return;
		case 'builtLeaf':
			writeBuiltLeaf(words, at, format, cell.kind, { at: cell.offset, len: cell.len }, changedWord(cell.changed));
			return;
		case 'builtText':
			writeBuiltText(words, at, format, { at: cell.offset, len: cell.len });
			return;
		case 'copiedLeaf':
			writeCopiedLeaf(words, at, format, cell.kind, { at: cell.offset, len: cell.len }, cell.record);
			return;
		default:
			throw new Error(`a built record never writes a ${cell.form} cell`);
	}
}

function changedWord(changed: ChangedEdges): number {
	return (changed.leading ? 1 : 0) | (changed.trailing ? 2 : 0);
}

/** Writes the cell of the slot whose cell is at `word` of the drafted `record`, holding `value`. */
export function storeCell(arena: BuiltArena, record: BuiltDraft, word: number, value: unknown): void {
	storeAt(arena, record.data, record.base + word, value, record, word, 0, NO_EDGES);
}

function storeAt(arena: BuiltArena, data: Uint32Array, at: number, value: unknown, record: BuiltDraft, word: number, item: number, changed: ChangedEdges): void {
	if (value === undefined || value === null) return;
	if (typeof value === 'number') return writeUnit(data, at, arena.format, value, 0);
	if (typeof value === 'string') return writeBuiltText(data, at, arena.format, arena.text(value));
	const ref = builtRefOf(value);
	if (ref === undefined && typeof value === 'object') return storeParsed(arena, data, at, value, changed);
	if (ref === undefined || ref.arena !== arena) throw new Error(`a built record holds only nodes its own engine built, not ${foreignValue(value, ref)}`);
	const kind = (value as { readonly $type: number }).$type;
	if (ref.at !== undefined) return writeChild(data, at, arena.format, kind, ref.at, 0, changedWord(changed));
	writeBuiltLeaf(data, at, arena.format, kind, ref.text, changedWord(changed));
	(record.placed ??= []).push(value, word, item);
}

/** Sets the presence bits `mask` of the word at `at` of a fresh record. */
export function storeFlag(data: Uint32Array, at: number, mask: number): void {
	data[at] = (data[at]! | mask) >>> 0;
}

/**
 * Writes the cell of a slot holding the untouched parsed node `value`: a child linking the record its tree's reader
 * writes for it, or, for a parsed leaf, which has no record, a copied leaf whose header names the parsed one. The
 * arena holds the tree from then on.
 *
 * @throws For a node no read produced, or one read through an engine that does not read trees as records.
 */
function storeParsed(arena: BuiltArena, data: Uint32Array, at: number, value: object, changed: ChangedEdges): void {
	const coordinate = isCoordinate(value) ? value : coordinateOf(value);
	const token = treeTokenOf(value);
	const tree = coordinate === undefined ? undefined : treeOf(value);
	if (coordinate === undefined || token === undefined || tree?.records === undefined || tree.id === undefined) {
		throw new Error(`a built record holds only nodes its own engine built or a record tree read, not ${foreignValue(value, undefined)}`);
	}
	const own = (value as { readonly $type?: unknown }).$type;
	const kind = typeof own === 'number' ? own : coordinate.$type;
	if (kind === undefined) throw new Error('a built record cannot name a parsed node whose coordinate stamps no kind');
	arena.hold(tree as TreeHandle & { readonly id: number }, token);
	const index = decodeIndex(coordinate.$treeHandle);
	const record = recordOf(value) ?? rowRecordOf(tree.records, index, kind);
	if (record !== undefined) return writeChild(data, at, arena.format, kind, record, tree.id + 1, changedWord(changed));
	const text = tree.text?.(coordinate.$span);
	if (text === undefined) throw new Error(`the parsed leaf of kind ${kind} has a tree that answers no text`);
	writeCopiedLeaf(data, at, arena.format, kind, arena.text(text), arena.parsedLeaf(kind, tree.id, index, coordinate.$end, coordinate.$span, changed));
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

/** Writes the cell of the list slot at `word` of the drafted `record`: a run of `items.length` cells, `stride` words each. */
export function storeList(arena: BuiltArena, record: BuiltDraft, word: number, items: readonly unknown[], stride: number): void {
	if (items.length === 0) return;
	const run = arena.run(items.length, stride);
	for (let n = 0; n < items.length; n++) storeAt(arena, run.data, run.base + n * stride, items[n], record, word, n, changedEdges(items, n, arena.kinds));
	record.data[record.base + word] = run.at;
	record.data[record.base + word + 1] = items.length;
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
	record.data[record.base + 1] = arena.push(side);
}

function keptAt(record: BuiltDraft, word: number, value: unknown): boolean {
	const kept = record.kept;
	return kept !== undefined && word in kept && kept[word] === value;
}

function patchedAt(record: BuiltDraft, word: number, width: number): void {
	record.data.fill(0, record.base + word, record.base + word + width);
	(record.patched ??= []).push(word);
}

export function patchCell(arena: BuiltArena, record: BuiltDraft, word: number, width: number, value: unknown): void {
	if (keptAt(record, word, value)) return;
	patchedAt(record, word, width);
	storeCell(arena, record, word, value);
}

export function patchList(arena: BuiltArena, record: BuiltDraft, word: number, items: readonly unknown[], stride: number): void {
	const kept = record.kept?.[word];
	if (Array.isArray(kept) && kept.length === items.length && items.every((item, n) => item === kept[n])) return;
	patchedAt(record, word, 2);
	storeList(arena, record, word, items, stride);
}

export function patchFlag(record: BuiltDraft, word: number, mask: number, on: unknown): void {
	const at = record.base + word;
	record.data[at] = on ? (record.data[at]! | mask) >>> 0 : (record.data[at]! & ~mask) >>> 0;
}

export function patchListOptions(arena: BuiltArena, record: BuiltDraft, delimiter: number | undefined, separator: number | undefined): void {
	if (record.copyOf !== undefined) {
		const source: RecordPosition = { $type: record.data[record.base]!, $tree: arena.tree, $at: record.copyOf, $_layout: undefined };
		if (delimiter === recordDelimiter(source) && separator === recordSeparator(source)) return;
	}
	record.data[record.base + 1] = 0;
	storeListOptions(arena, record, delimiter, separator);
}
