import { bindTree, type TreeEngineHandle } from './engine-scope.ts';
import { wrapRegistered } from './identity.ts';
import { coordinateOf, holdReadTree, isRead } from './node-data.ts';
import { decodeIndex, isCoordinate } from './read.ts';
import { treeOf, treeTokenOf, type TreeToken } from './tree-token.ts';
import type { RecordReader, TreeHandle } from './read.ts';
import { addressOf, chunkOf, wordOf, type CellFormat, type RecordCell } from './record-cell.ts';
import { adoptBuilt, builtRefOf, type BuiltRef } from './built-ref.ts';
import { RECORD, recordOf, recordStub, type RecordStub } from './record-view.ts';

/** Text a built arena interned: its UTF-8 bytes' packed offset in the arena's string chunks and their length. */
export interface BuiltText {
	readonly at: number;
	readonly len: number;
}

/** Words a built arena allocated: the chunk holding them, their first word in it, their packed address and their count. */
export interface BuiltPlace {
	readonly data: Uint32Array;
	readonly base: number;
	readonly at: number;
	readonly words: number;
}

type Wrap = (data: object, tree: TreeHandle) => unknown;

/** What an engine that reads trees as records gives its built arena: the cell format, and the trivia table its records' sides are written to, by record address. */
export interface BuiltRecords {
	readonly format: CellFormat;
	readonly trivia: Required<Pick<TreeHandle, 'triviaSide' | 'writeTriviaSide'>>;
}

const FIRST_CHUNK_WORDS = 1 << 10;
const FIRST_STRING_BYTES = 1 << 12;
const EMPTY_RUN: BuiltPlace = Object.freeze({ data: new Uint32Array(0), base: 0, at: 0, words: 0 });
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

class Chunks<A extends Uint32Array | Uint8Array> {
	readonly #make: (length: number) => A;
	readonly #first: number;
	readonly #limit: number;
	readonly #most: number;
	readonly chunks: A[] = [];
	readonly used: number[] = [];
	#open = -1;

	constructor(make: (length: number) => A, first: number, format: CellFormat) {
		this.#make = make;
		this.#limit = 2 ** format.chunkShift;
		this.#most = 2 ** (32 - format.chunkShift);
		this.#first = Math.min(first, this.#limit);
	}

	/** `size` units in one chunk: the open shared chunk while it has room, else a new one twice its size up to the address limit, or a chunk of their own when larger than that. */
	alloc(size: number): { readonly chunk: number; readonly word: number; readonly data: A } {
		if (!Number.isSafeInteger(size) || size < 0) throw new Error(`a built arena cannot allocate ${size} units`);
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
		const chunk = this.chunks.length;
		if (chunk >= this.#most) throw new Error('a built arena holds as many chunks as an address can name');
		this.chunks.push(this.#make(length));
		this.used.push(0);
		return chunk;
	}

	/** Gives back the unwritten tail of the last allocation in `chunk`, so `used` units of it stay written. */
	trim(chunk: number, used: number): void {
		this.used[chunk] = used;
	}

	/** Whether `length` units from `unit` of `chunk` are written. */
	holds(chunk: number, unit: number, length: number): boolean {
		const used = this.used[chunk];
		return used !== undefined && unit + length <= used;
	}
}

/**
 * The records an engine's builders write, and the nodes that view them. The records are chunks of words and of
 * UTF-8 bytes that JavaScript owns and native code borrows for one call at a time. The arena only appends: a
 * record, once written, never changes. Address 0 names no record, so the first chunk's first word is never
 * allocated. A record's node is the one its builder returned, kept while anything holds it; a read of a cell
 * naming a record whose node was released views the record afresh.
 */
export class BuiltArena {
	readonly format: CellFormat;
	/** The tree a built record's view reads through: its records are this arena's, and its trivia table is keyed by their addresses. */
	readonly tree: TreeHandle & BuiltRecords['trivia'];
	readonly #wrap: Wrap;
	readonly #words: Chunks<Uint32Array>;
	readonly #bytes: Chunks<Uint8Array>;
	readonly #textByValue = new Map<string, BuiltText>();
	readonly #textByAt = new Map<number, { readonly value: string; readonly len: number }>();
	readonly #nodes = new Map<number, WeakRef<object>>();
	readonly #trees = new Map<number, { readonly tree: TreeHandle; readonly token: TreeToken }>();
	readonly #released = new FinalizationRegistry<number>((at) => {
		if (this.#nodes.get(at)?.deref() === undefined) this.#nodes.delete(at);
	});

	constructor({ format, trivia }: BuiltRecords, wrap: Wrap, handle: TreeEngineHandle) {
		this.format = format;
		this.#wrap = wrap;
		this.tree = { built: this, ...trivia };
		bindTree(this.tree, handle);
		this.#words = new Chunks((length) => new Uint32Array(length), FIRST_CHUNK_WORDS, format);
		this.#bytes = new Chunks((length) => new Uint8Array(length), FIRST_STRING_BYTES, format);
		this.#words.alloc(1);
	}

	#place(size: number): BuiltPlace {
		const { chunk, word, data } = this.#words.alloc(size);
		return { data, base: word, at: addressOf(chunk, word, this.format), words: size };
	}

	/** A record of `kind`, `words` long with its header, zeroed but for its kind: no side record, every cell absent. */
	record(kind: number, words: number): BuiltPlace {
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

	/** Every chunk of words and of bytes, each cut to what is written, for one native call to borrow. */
	chunks(): { readonly words: readonly Uint32Array[]; readonly bytes: readonly Uint8Array[] } {
		const cut = <A extends Uint32Array | Uint8Array>(table: Chunks<A>): A[] =>
			table.chunks.map((chunk, n) => chunk.subarray(0, table.used[n]) as A);
		return { words: cut(this.#words), bytes: cut(this.#bytes) };
	}

	#adopt<T extends object>(node: T, at: number, text: BuiltText | undefined): T {
		adoptBuilt(node, { arena: this, at, text });
		this.#nodes.set(at, new WeakRef(node));
		this.#released.register(node, at);
		return node;
	}

	#view(at: number): object {
		const head = this.words(at, 1);
		const stub = { $type: head[wordOf(at, this.format)]!, [RECORD]: at } as RecordStub;
		return this.#adopt(this.#wrap(stub, this.tree) as object, at, undefined);
	}

	/** The node of the compound record its builder just wrote at `record`: a view of the record. */
	view(record: BuiltPlace): object {
		return this.#view(record.at);
	}

	/** Gives the leaf `node` of `kind` its record, `words` long, header only, and the interned `text` its cells hold. */
	adoptLeaf<T extends object>(node: T, kind: number, words: number, text: string): T {
		return this.#adopt(node, this.record(kind, words).at, this.text(text));
	}

	/** The node of the compound record at `at`: its builder's while it is held, else a fresh view of the record. */
	node(at: number): object {
		return this.#nodes.get(at)?.deref() ?? this.#view(at);
	}

	/** Holds the parsed tree `tree`, which a record of this arena names, with its `token`, for as long as the arena lives. */
	hold(tree: TreeHandle & { readonly id: number }, token: TreeToken): void {
		this.#trees.set(tree.id, { tree, token });
	}

	/** The node a child cell linking the record `at` of parsed tree `tree` names: the parsed tree's own view of it. */
	linked(tree: number, at: number): object {
		const held = this.#trees.get(tree);
		if (held === undefined) throw new Error(`a built record links parsed tree ${tree}, which its arena does not hold`);
		const stub = recordStub(held.tree, at);
		holdReadTree(stub, held.token);
		const role = held.tree.records?.record(decodeIndex(stub.$_layout.at.$treeHandle)) === at ? 'node' : 'aliasContent';
		return wrapRegistered(stub, held.tree, this.#wrap as (data: object, tree: TreeHandle) => object, role);
	}

	/** The header record of the parsed leaf `node`, of `kind`, a built record holds: its side record names the leaf's tree, rows and byte span. */
	parsedLeaf(node: object, kind: number, tree: number, index: number, end: number, span: { readonly start: number; readonly end: number }): number {
		const record = this.record(kind, 2);
		record.data[record.base + 1] = this.push([this.format.sideSides.bit, tree, index, end, span.start, span.end]);
		this.#nodes.set(record.at, new WeakRef(node));
		this.#released.register(node, record.at);
		return record.at;
	}

	/** The node of the built leaf whose cell names the record `at`. */
	leaf(at: number): object {
		const known = this.#nodes.get(at)?.deref();
		if (known === undefined) throw new Error(`the built leaf at ${at} was released while a record still names it`);
		return known;
	}
}

/** Whether `value` is the node of a built record, which its builder checked as it wrote it. */
export function isBuiltNode(value: object): boolean {
	return builtRefOf(value) !== undefined;
}

/** The arena whose record `value` is the node of, `undefined` for a node no builder of an arena made. */
export function builtArenaOf(value: object): BuiltArena | undefined {
	return builtRefOf(value)?.arena;
}

/** The address of the record `value` is the node of in `arena`, `undefined` for any other value. */
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

function writeBuiltLeaf(words: Uint32Array | number[], at: number, format: CellFormat, kind: number, text: BuiltText, record: number): void {
	words[at] = format.builtLeaf;
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
			writeChild(words, at, format, cell.kind, cell.at, cell.link === undefined ? 0 : cell.link + 1, (cell.changed.leading ? 1 : 0) | (cell.changed.trailing ? 2 : 0));
			return;
		case 'unit':
			writeUnit(words, at, format, cell.kind, cell.row === undefined ? 0 : cell.row + 1);
			return;
		case 'builtLeaf':
			writeBuiltLeaf(words, at, format, cell.kind, { at: cell.offset, len: cell.len }, cell.record);
			return;
		case 'builtText':
			writeBuiltText(words, at, format, { at: cell.offset, len: cell.len });
			return;
		default:
			throw new Error(`a built record never writes a ${cell.form} cell`);
	}
}

/**
 * Writes the cell of a slot holding `value` into a fresh record at `at`: nothing for no value, a unit for a kind id,
 * a captured string for text, else a built leaf or a child naming the record of a node built in `arena`.
 *
 * @throws For a node no builder of `arena` made.
 */
export function storeCell(arena: BuiltArena, data: Uint32Array, at: number, value: unknown): void {
	if (value === undefined || value === null) return;
	if (typeof value === 'number') return writeUnit(data, at, arena.format, value, 0);
	if (typeof value === 'string') return writeBuiltText(data, at, arena.format, arena.text(value));
	const ref = builtRefOf(value);
	if (ref === undefined && typeof value === 'object') return storeParsed(arena, data, at, value);
	if (ref === undefined || ref.arena !== arena) throw new Error(`a built record holds only nodes its own engine built, not ${foreignValue(value, ref)}`);
	const kind = (value as { readonly $type: number }).$type;
	if (ref.text !== undefined) writeBuiltLeaf(data, at, arena.format, kind, ref.text, ref.at);
	else writeChild(data, at, arena.format, kind, ref.at, 0, 0);
}

/** Sets the presence bits `mask` of the word at `at` of a fresh record. */
export function storeFlag(data: Uint32Array, at: number, mask: number): void {
	data[at] = (data[at]! | mask) >>> 0;
}

/**
 * Writes the cell of a slot holding the untouched parsed node `value`: a child linking the record its tree's reader
 * writes for it, or, for a parsed leaf, which has no record, a built leaf whose header names the parsed one. The
 * arena holds the tree from then on.
 *
 * @throws For a node no read produced, or one read through an engine that does not read trees as records.
 */
function storeParsed(arena: BuiltArena, data: Uint32Array, at: number, value: object): void {
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
	if (record !== undefined) return writeChild(data, at, arena.format, kind, record, tree.id + 1, 0);
	const text = tree.text?.(coordinate.$span);
	if (text === undefined) throw new Error(`the parsed leaf of kind ${kind} has a tree that answers no text`);
	writeBuiltLeaf(data, at, arena.format, kind, arena.text(text), arena.parsedLeaf(value, kind, tree.id, index, coordinate.$end, coordinate.$span));
}

function rowRecordOf(records: RecordReader, index: number, kind: number): number | undefined {
	const record = records.record(index);
	if (record === undefined || records.words(record, 1)[wordOf(record, records.format)] === kind) return record;
	const content = records.candidates(index).find(([at]) => decodeIndex(at.$treeHandle) === index && at.$type === kind);
	return content?.[1] ?? undefined;
}

function foreignValue(value: unknown, ref: BuiltRef | undefined): string {
	if (ref !== undefined) return `a node of kind ${(value as { readonly $type?: unknown }).$type} another engine built`;
	if (typeof value !== 'object' || value === null) return `a ${typeof value}`;
	const kind = (value as { readonly $type?: unknown }).$type;
	if (typeof kind !== 'number') return `an object with keys ${Object.keys(value).slice(0, 6).join(', ')}`;
	if (coordinateOf(value) !== undefined || isRead(value)) return `a node of kind ${kind} read from a tree`;
	return `an object node of kind ${kind}`;
}

/** Writes a list slot's cell into a fresh record at `at`: a run of `items.length` cells, `stride` words each. */
export function storeList(arena: BuiltArena, data: Uint32Array, at: number, items: readonly unknown[], stride: number): void {
	if (items.length === 0) return;
	const run = arena.run(items.length, stride);
	for (let n = 0; n < items.length; n++) storeCell(arena, run.data, run.base + n * stride, items[n]);
	data[at] = run.at;
	data[at + 1] = items.length;
}

/** Gives the fresh list record `record` a side record holding the settings a builder chose: its delimiters and its separator. */
export function storeListOptions(arena: BuiltArena, record: BuiltPlace, delimiter: number | undefined, separator: number | undefined): void {
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
