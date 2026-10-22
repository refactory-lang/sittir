import type { ByteSpan, NodeCoordinate } from '@sittir/types';
import { decodeIndex, encodeHandle, type RecordReader, type TreeHandle } from './read.ts';
import { decodeCell, decodeListCell, decodeSideDelimiter, decodeSideRow, wordOf, type RecordCell } from './record-cell.ts';
import { aliasContentOf, carryReadTree, coordinateOf } from './node-data.ts';

/** The own key of a record stub and of the view made from it: the record's address. */
export const RECORD = Symbol.for('sittir.record');

/** A record as the read returns it, before the wrap table makes it a view: its kind, its address and its coordinate. */
export interface RecordStub {
	readonly $type: number;
	readonly [RECORD]: number;
	readonly $_layout: { readonly at: NodeCoordinate };
}

/** A slot's place in its record, as the generated `records` table stamps it. */
export type RecordPlace = { readonly word: number; readonly width: number; readonly run?: number } | { readonly word: number; readonly bit: number };

/** The address a record stub or view holds, `undefined` for any other value. */
export function recordOf(value: unknown): number | undefined {
	if (value === null || typeof value !== 'object') return undefined;
	const at: unknown = (value as { readonly [RECORD]?: unknown })[RECORD];
	return typeof at === 'number' ? at : undefined;
}

function recordsOf(tree: TreeHandle): RecordReader {
	if (tree.records === undefined) throw new Error('a record view needs a tree its engine reads as records');
	return tree.records;
}

function idOf(tree: TreeHandle): number {
	if (tree.id === undefined) throw new Error('a record view needs a tree with an id');
	return tree.id;
}

/** The words of the record at `at`, `length` of them, and where the record starts in them. */
function wordsAt(records: RecordReader, at: number, length: number): { readonly words: Uint32Array; readonly start: number } {
	return { words: records.words(at, length), start: wordOf(at, records.format) };
}

/** The words of the side record at `side`, long enough for every field before a list's delimiters setting and the setting itself. */
function sideWordsAt(records: RecordReader, side: number): { readonly words: Uint32Array; readonly start: number } {
	const { words: head, start } = wordsAt(records, side, 1);
	const mask = head[start]!;
	const length = records.format.sideBeforeDelimiter.reduce((sum, field) => sum + ((mask & field.bit) === 0 ? 0 : field.words), 1);
	return wordsAt(records, side, (mask & records.format.sideDelimiter) === 0 ? length : length + 1);
}

/** The address of the side record of the record at `at`, 0 for none. */
function sideOf(records: RecordReader, at: number): number {
	const { words, start } = wordsAt(records, at, 2);
	return words[start + 1]!;
}

/** The coordinate of the row the node at `index` is, spanning `span`: its kind and subtree end as a read names them (`RecordReader.coordinate`). */
function coordinateAt(tree: TreeHandle, index: number, span: ByteSpan): NodeCoordinate {
	const { kind, end } = recordsOf(tree).coordinate(index);
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
	const records = recordsOf(tree);
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

/** The value of the slot at `place` of the record `holder` views, for a slot that stores values rather than nodes: a presence bit, a unit's kind id, a captured string, or a list of them. */
export function recordValue(holder: object, tree: TreeHandle, place: RecordPlace): unknown {
	if ('bit' in place) return recordFlag(holder, tree, place);
	return place.run === undefined ? recordSlot(holder, tree, place) : recordSlots(holder, tree, place);
}

const rows = new WeakMap<object, Record<string, unknown>>();

/** The object node of the row the view `node` reads, read once and kept: what a view's writes, queries and snapshots go through. */
export function rowOf(node: object, tree: TreeHandle, wrap: (data: object, tree: TreeHandle) => unknown): Record<string, unknown> {
	const known = rows.get(node);
	if (known !== undefined) return known;
	const row = wrap(rowData(node, tree) as object, tree) as Record<string, unknown>;
	rows.set(node, row);
	return row;
}

/** The read data of the row a record stub or view names, read as an object (`RecordReader.object`). */
export function rowData(stub: object, tree: TreeHandle): unknown {
	const at = coordinateOf(stub);
	if (at === undefined) throw new Error('a record view names no row');
	const kind = (stub as { readonly $type?: number }).$type;
	let row = recordsOf(tree).object(decodeIndex(at.$treeHandle), 1);
	while (row !== null && typeof row === 'object') {
		if ((row as { readonly $type?: number }).$type === kind) return row;
		row = aliasContentOf(row);
	}
	throw new Error(`the row of a record of kind ${kind} holds no node of that kind`);
}

type Members = Readonly<Record<string, (...args: unknown[]) => unknown>>;

/** A view's setter `name` called with `args`, through its row's `$with`. */
export function rowWith(node: object, tree: TreeHandle, wrap: (data: object, tree: TreeHandle) => unknown, name: string, args: readonly unknown[]): unknown {
	return (rowOf(node, tree, wrap).$with as Members)[name]!(...args);
}

/** A view's trivia `side` read or written with `items`, through its row's `$trivia`. */
export function rowTrivia(node: object, tree: TreeHandle, wrap: (data: object, tree: TreeHandle) => unknown, side: string, items: readonly unknown[]): unknown {
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
			if (cell.link !== undefined && cell.link !== idOf(tree)) throw new Error(`a parsed record names a record of tree ${cell.link}`);
			return carryReadTree(holder, recordStub(tree, cell.at));
		case 'unit':
			return cell.kind;
		case 'builtLeaf':
		case 'builtText':
			throw new Error('a parsed record holds no built cell');
	}
}

function placeOf(place: RecordPlace): { readonly word: number; readonly width: number; readonly run?: number } {
	if ('bit' in place) throw new Error(`word ${place.word} bit ${place.bit} is a presence bit, not a cell`);
	return place;
}

/** The value of the one-cell slot at `place` of the record `holder` views, as read data. */
export function recordSlot(holder: object, tree: TreeHandle, place: RecordPlace): unknown {
	const at = recordOf(holder);
	if (at === undefined) throw new Error('a record slot read needs a record view');
	const records = recordsOf(tree);
	const { word, width } = placeOf(place);
	const { words, start } = wordsAt(records, at, word + width);
	return cellData(holder, tree, decodeCell(words, start + word, records.format));
}

/** The items of the list slot at `place` of the record `holder` views, each as read data. */
export function recordSlots(holder: object, tree: TreeHandle, place: RecordPlace): readonly unknown[] {
	const at = recordOf(holder);
	if (at === undefined) throw new Error('a record slot read needs a record view');
	const records = recordsOf(tree);
	const { word, width, run } = placeOf(place);
	if (run === undefined) return [recordSlot(holder, tree, place)].filter((item) => item !== undefined);
	const { words, start } = wordsAt(records, at, word + width);
	const list = decodeListCell(words, start + word);
	if (list.len === 0) return [];
	const items = wordsAt(records, list.run, list.len * run);
	return Array.from({ length: list.len }, (_, n) => cellData(holder, tree, decodeCell(items.words, items.start + n * run, records.format)));
}

const itemsRead = new WeakMap<object, Map<number, readonly unknown[]>>();

/** The items of the list slot at `place` of the record `holder` views, each hydrated by `hydrateOne` once and kept frozen, so every read returns the same array. */
export function recordItems(holder: object, tree: TreeHandle, place: RecordPlace, hydrateOne: (data: unknown) => unknown): readonly unknown[] {
	let read = itemsRead.get(holder);
	if (read === undefined) itemsRead.set(holder, (read = new Map()));
	const known = read.get(place.word);
	if (known !== undefined) return known;
	const items = Object.freeze(recordSlots(holder, tree, place).map(hydrateOne));
	read.set(place.word, items);
	return items;
}

/** The number of items the list slot at `place` of the record `holder` views holds. */
export function recordLength(holder: object, tree: TreeHandle, place: RecordPlace): number {
	const at = recordOf(holder);
	if (at === undefined) throw new Error('a record slot read needs a record view');
	const records = recordsOf(tree);
	const { word, width, run } = placeOf(place);
	if (run === undefined) return recordSlot(holder, tree, place) === undefined ? 0 : 1;
	const { words, start } = wordsAt(records, at, word + width);
	return decodeListCell(words, start + word).len;
}

/** Whether the presence bit at `place` of the record `holder` views is set. */
export function recordFlag(holder: object, tree: TreeHandle, place: RecordPlace): boolean {
	const at = recordOf(holder);
	if (at === undefined) throw new Error('a record slot read needs a record view');
	if (!('bit' in place)) throw new Error(`word ${place.word} is a cell, not a presence bit`);
	const { words, start } = wordsAt(recordsOf(tree), at, place.word + 1);
	return ((words[start + place.word]! >>> place.bit) & 1) === 1;
}
