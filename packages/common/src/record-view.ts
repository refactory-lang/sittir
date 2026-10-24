import type { ByteSpan, NodeCoordinate } from '@sittir/types';
import { decodeIndex, encodeHandle, type RecordReader, type RecordWords, type TreeHandle } from './read.ts';
import {
	decodeCell,
	decodeListCell,
	decodeSideDelimiter,
	decodeSideRow,
	wordOf,
	type RecordCell
} from './record-cell.ts';
import { aliasContentOf, carryReadTree, coordinateOf } from './node-data.ts';

/** The own key of a record stub and of the view made from it: the record's address. */
export const RECORD = Symbol.for('sittir.record');

/** A record as the read returns it, before the wrap table makes it a view: its kind, its address and its coordinate. */
export interface RecordStub {
	readonly $type: number;
	readonly [RECORD]: number;
	readonly $_layout: { readonly at: NodeCoordinate };
}

/** The address a record stub or view holds, `undefined` for any other value. */
export function recordOf(value: unknown): number | undefined {
	if (value === null || typeof value !== 'object') return undefined;
	const at: unknown = (value as { readonly [RECORD]?: unknown })[RECORD];
	return typeof at === 'number' ? at : undefined;
}

function recordsOf(tree: TreeHandle): RecordWords {
	const records = tree.records ?? tree.built;
	if (records === undefined) throw new Error('a record view needs a tree its engine reads as records, or a built arena');
	return records;
}

function parsedRecordsOf(tree: TreeHandle): RecordReader {
	if (tree.records === undefined) throw new Error('a built record names no row of a parsed tree');
	return tree.records;
}

function idOf(tree: TreeHandle): number {
	if (tree.id === undefined) throw new Error('a record view needs a tree with an id');
	return tree.id;
}

/** The words of the record at `at`, `length` of them, and where the record starts in them. */
function wordsAt(
	records: RecordWords,
	at: number,
	length: number
): { readonly words: Uint32Array; readonly start: number } {
	return { words: records.words(at, length), start: wordOf(at, records.format) };
}

/** The words of the side record at `side`, long enough for every field before a list's delimiters setting and the setting itself. */
function sideWordsAt(records: RecordWords, side: number): { readonly words: Uint32Array; readonly start: number } {
	const { words: head, start } = wordsAt(records, side, 1);
	const mask = head[start]!;
	const length = records.format.sideBeforeDelimiter.reduce(
		(sum, field) => sum + ((mask & field.bit) === 0 ? 0 : field.words),
		1
	);
	return wordsAt(records, side, (mask & records.format.sideDelimiter) === 0 ? length : length + 1);
}

/** The address of the side record of the record at `at`, 0 for none. */
function sideOf(records: RecordWords, at: number): number {
	const { words, start } = wordsAt(records, at, 2);
	return words[start + 1]!;
}

/** The coordinate of the row the node at `index` is, spanning `span`: its kind and subtree end as a read names them (`RecordReader.coordinate`). */
function coordinateAt(tree: TreeHandle, index: number, span: ByteSpan): NodeCoordinate {
	const { kind, end } = parsedRecordsOf(tree).coordinate(index);
	return { $treeHandle: encodeHandle(idOf(tree), index), $end: end, $span: span, $type: kind };
}

/** The coordinate of a parsed record: the row and byte span its side record stamps (`coordinateAt`). */
function rowCoordinate(tree: TreeHandle, records: RecordReader, side: number, kind: number): NodeCoordinate {
	if (side === 0) throw new Error(`a parsed record of kind ${kind} names no side record, so no row`);
	const { words, start } = sideWordsAt(records, side);
	const row = decodeSideRow(words, start, records.format);
	if (row === undefined) throw new Error(`the side record of a parsed record of kind ${kind} holds no row`);
	return coordinateAt(tree, row.index, row.span);
}

/** The record at `at` of `tree` as a stub: its kind and its coordinate, read from its own words. */
export function recordStub(tree: TreeHandle, at: number): RecordStub {
	const records = parsedRecordsOf(tree);
	const { words, start } = wordsAt(records, at, 2);
	const kind = words[start]!;
	return { $type: kind, [RECORD]: at, $_layout: { at: rowCoordinate(tree, records, words[start + 1]!, kind) } };
}

/** The delimiters setting of the list the record `holder` views, as its side record holds it; `undefined` when it holds none. */
export function recordDelimiter(holder: object, tree: TreeHandle): number | undefined {
	const at = recordOf(holder);
	if (at === undefined) throw new Error('a record option read needs a record view');
	const records = recordsOf(tree);
	const side = sideOf(records, at);
	if (side === 0) return undefined;
	const { words, start } = sideWordsAt(records, side);
	return decodeSideDelimiter(words, start, records.format);
}

const rows = new WeakMap<object, Record<string, unknown>>();

/** The object node of the row the view `node` reads, read once and kept: what a view's writes, queries and snapshots go through. */
export function rowOf(
	node: object,
	tree: TreeHandle,
	wrap: (data: object, tree: TreeHandle) => unknown
): Record<string, unknown> {
	const known = rows.get(node);
	if (known !== undefined) return known;
	const row = wrap(rowData(node, tree) as object, tree) as Record<string, unknown>;
	rows.set(node, row);
	return row;
}

/** Makes `row` what the writes of the built view `node` go through: the setters and trivia its builder made. */
export function bindRow(node: object, row: Record<string, unknown>): void {
	rows.set(node, row);
}

/** The read data of the row a record stub or view names, read as an object (`RecordReader.object`). */
export function rowData(stub: object, tree: TreeHandle): unknown {
	const at = coordinateOf(stub);
	if (at === undefined) throw new Error('a record view names no row');
	const kind = (stub as { readonly $type?: number }).$type;
	let row = parsedRecordsOf(tree).object(decodeIndex(at.$treeHandle), 1);
	while (row !== null && typeof row === 'object') {
		if ((row as { readonly $type?: number }).$type === kind) return row;
		row = aliasContentOf(row);
	}
	throw new Error(`the row of a record of kind ${kind} holds no node of that kind`);
}

type Members = Readonly<Record<string, (...args: unknown[]) => unknown>>;

/** A view's setter `name` called with `args`, through its row's `$with`. */
export function rowWith(
	node: object,
	tree: TreeHandle,
	wrap: (data: object, tree: TreeHandle) => unknown,
	name: string,
	args: readonly unknown[]
): unknown {
	return (rowOf(node, tree, wrap).$with as Members)[name]!(...args);
}

/** A view's trivia `side` read or written with `items`, through its row's `$trivia`. */
export function rowTrivia(
	node: object,
	tree: TreeHandle,
	wrap: (data: object, tree: TreeHandle) => unknown,
	side: string,
	items: readonly unknown[]
): unknown {
	return (rowOf(node, tree, wrap).$trivia as Members)[side]!(...items);
}

/** A parsed leaf as read data: its kind, its coordinate (`coordinateAt`) and its text, which the tree answers each time it is asked (`TreeHandle.text`). */
function leafData(tree: TreeHandle, kind: number, span: ByteSpan, row: number): object {
	const text = tree.text;
	if (text === undefined) throw new Error('a record view needs a tree that answers its text');
	return { $type: kind, $text: () => text(span), $_layout: { at: coordinateAt(tree, row, span) } };
}

/** The value a cell holds, as read data: what `hydrate` turns into the node an accessor returns. */
function cellData(holder: object, tree: TreeHandle, cell: RecordCell): unknown {
	switch (cell.form) {
		case 'absent':
			return undefined;
		case 'coordinate':
			return coordinateAt(tree, cell.index, cell.span);
		case 'parsedLeaf':
			return carryReadTree(holder, leafData(tree, cell.kind, cell.span, cell.row));
		case 'parsedText':
			return tree.text?.(cell.span);
		case 'child':
			if (tree.built !== undefined) return cell.link === undefined ? tree.built.node(cell.at) : tree.built.linked(cell.link, cell.at);
			if (cell.link !== undefined && cell.link !== idOf(tree))
				throw new Error(`a parsed record names a record of tree ${cell.link}`);
			return carryReadTree(holder, recordStub(tree, cell.at));
		case 'unit':
			return cell.kind;
		case 'builtLeaf':
			if (tree.built === undefined) throw new Error('a parsed record holds no built cell');
			return tree.built.leaf(cell.record);
		case 'builtText':
			if (tree.built === undefined) throw new Error('a parsed record holds no built cell');
			return tree.built.textOf(cell.offset, cell.len);
	}
}

/** The value of the one-cell slot at the generated `word` offset of the record `holder` views, as read data. */
export function recordSlot(holder: object, tree: TreeHandle, word: number, width: number, inline = 0): unknown {
	const at = recordOf(holder);
	if (at === undefined) throw new Error('a record slot read needs a record view');
	const records = recordsOf(tree);
	const { words, start } = wordsAt(records, at, word + width);
	return cellData(
		holder,
		tree,
		decodeCell(words.subarray(start + word, start + word + width), 0, records.format, inline, at + word)
	);
}

/** The items of the list slot at the generated `word` offset of the record `holder` views, each as read data. */
export function recordSlots(
	holder: object,
	tree: TreeHandle,
	word: number,
	width: number,
	run?: number,
	inline = 0
): readonly unknown[] {
	const at = recordOf(holder);
	if (at === undefined) throw new Error('a record slot read needs a record view');
	const records = recordsOf(tree);
	if (run === undefined) return [recordSlot(holder, tree, word, width, inline)].filter((item) => item !== undefined);
	const { words, start } = wordsAt(records, at, word + width);
	const list = decodeListCell(words, start + word);
	if (list.len === 0) return [];
	const items = wordsAt(records, list.run, list.len * run);
	return Array.from({ length: list.len }, (_, n) =>
		cellData(holder, tree, decodeCell(items.words, items.start + n * run, records.format))
	);
}

const itemsRead = new WeakMap<object, Map<number, readonly unknown[]>>();

/** The items of the list slot at the generated `word` offset of the record `holder` views, each hydrated by `hydrateOne` once and kept frozen, so every read returns the same array. */
export function recordItems(
	holder: object,
	tree: TreeHandle,
	word: number,
	width: number,
	run: number | undefined,
	hydrateOne: (data: unknown) => unknown,
	inline = 0
): readonly unknown[] {
	let read = itemsRead.get(holder);
	if (read === undefined) itemsRead.set(holder, (read = new Map()));
	const known = read.get(word);
	if (known !== undefined) return known;
	const items = Object.freeze(recordSlots(holder, tree, word, width, run, inline).map(hydrateOne));
	read.set(word, items);
	return items;
}

/** The number of items the list slot at the generated `word` offset of the record `holder` views holds. */
export function recordLength(
	holder: object,
	tree: TreeHandle,
	word: number,
	width: number,
	run?: number,
	inline = 0
): number {
	const at = recordOf(holder);
	if (at === undefined) throw new Error('a record slot read needs a record view');
	const records = recordsOf(tree);
	if (run === undefined) return recordSlot(holder, tree, word, width, inline) === undefined ? 0 : 1;
	const { words, start } = wordsAt(records, at, word + width);
	return decodeListCell(words, start + word).len;
}

/** Whether the presence bit at the generated `word` offset of the record `holder` views is set. */
export function recordFlag(holder: object, tree: TreeHandle, word: number, bit: number): boolean {
	const at = recordOf(holder);
	if (at === undefined) throw new Error('a record slot read needs a record view');
	const { words, start } = wordsAt(recordsOf(tree), at, word + 1);
	return ((words[start + word]! >>> bit) & 1) === 1;
}
