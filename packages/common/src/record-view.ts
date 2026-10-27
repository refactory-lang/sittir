import type { ByteSpan, NodeCoordinate, QuerySlotEntry } from '@sittir/types';
import { decodeIndex, encodeHandle, type RecordReader, type RecordWords, type TreeHandle } from './read.ts';
import { builtRefOf } from './built-ref.ts';
import { treeOf } from './tree-token.ts';
import { treeBuiltArena, treeSlotTable, treeStructureTable } from './engine-scope.ts';
import { builderInputs, type BuilderInputs } from './builder-inputs.ts';
import {
	decodeCell,
	decodeListCell,
	decodeSideDelimiter,
	decodeSideRow,
	decodeSideSeparatorKind,
	sideListSettingOffset,
	wordOf,
	type RecordCell
} from './record-cell.ts';
import { aliasContentOf, carryReadTree, coordinateOf, isStorageKey } from './node-data.ts';
import { isRecordPosition, type RecordHandle, type RecordPosition } from './handle.ts';

export function positionWords(position: RecordPosition): Uint32Array {
	return recordsOf(position.$tree).words(position.$at, 2);
}

/** The address a record position or handle holds, `undefined` for any other value. */
export function recordOf(value: unknown): number | undefined {
	return isRecordPosition(value) ? value.$at : undefined;
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

function holderWords(holder: RecordPosition, length: number): { readonly words: Uint32Array; readonly start: number; readonly records: RecordWords } {
	const records = recordsOf(holder.$tree);
	const own = (holder as Partial<RecordHandle>).$words;
	return { words: own ?? records.words(holder.$at, length), start: wordOf(holder.$at, records.format), records };
}

function sideWordsAt(records: RecordWords, side: number): { readonly words: Uint32Array; readonly start: number } {
	const { words: head, start } = wordsAt(records, side, 1);
	const mask = head[start]!;
	const { format } = records;
	const held = [format.sideDelimiter, format.sideSeparatorKind].filter((bit) => (mask & bit) !== 0);
	const length = held.reduce((most, bit) => Math.max(most, sideListSettingOffset(mask, format, bit) + 1), sideListSettingOffset(mask, format, format.sideDelimiter));
	return wordsAt(records, side, length);
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

/** The record at `at` of `tree` as a position: its kind and its coordinate, read from its own words. */
export function recordStub(tree: TreeHandle, at: number): RecordPosition {
	const records = parsedRecordsOf(tree);
	const { words, start } = wordsAt(records, at, 2);
	const kind = words[start]!;
	return { $type: kind, $tree: tree, $at: at, $_layout: { at: rowCoordinate(tree, records, words[start + 1]!, kind) } };
}

export function recordDelimiter(holder: RecordPosition): number | undefined {
	return recordListSetting(holder, decodeSideDelimiter);
}

export function recordSeparator(holder: RecordPosition): number | undefined {
	return recordListSetting(holder, decodeSideSeparatorKind);
}

function recordListSetting(holder: RecordPosition, decode: (words: Uint32Array, at: number, format: RecordWords['format']) => number | undefined): number | undefined {
	const records = recordsOf(holder.$tree);
	const side = sideOf(records, holder.$at);
	if (side === 0) return undefined;
	const { words, start } = sideWordsAt(records, side);
	return decode(words, start, records.format);
}

const rows = new WeakMap<object, Record<string, unknown>>();

export function rowOf(node: RecordPosition, wrap: (data: object, tree: TreeHandle) => unknown): Record<string, unknown> {
	const known = rows.get(node);
	if (known !== undefined) return known;
	const row = wrap(rowData(node) as object, node.$tree) as Record<string, unknown>;
	rows.set(node, row);
	return row;
}

/** The read data of the row a record position names, read as an object (`RecordReader.object`). */
export function rowData(stub: RecordPosition): unknown {
	const at = coordinateOf(stub);
	if (at === undefined) throw new Error('a record view names no row');
	const kind = stub.$type;
	let row = parsedRecordsOf(stub.$tree).object(decodeIndex(at.$treeHandle), 1);
	while (row !== null && typeof row === 'object') {
		if ((row as { readonly $type?: number }).$type === kind) return row;
		row = aliasContentOf(row);
	}
	throw new Error(`the row of a record of kind ${kind} holds no node of that kind`);
}

type Members = Readonly<Record<string, (...args: unknown[]) => unknown>>;

/** A handle's setter `name` called with `args`: its kind's record setter where its engine builds records, else its row's `$with`. */
export function rowWith(node: RecordPosition, wrap: (data: object, tree: TreeHandle) => unknown, name: string, args: readonly unknown[]): unknown {
	const arena = node.$tree.built ?? treeBuiltArena(node.$tree);
	if (arena === undefined) return (rowOf(node, wrap).$with as Members)[name]!(...args);
	const set = arena.withOf(node.$type);
	if (set === undefined) throw new Error(`no record builder writes kind ${node.$type}, so a node of that kind has no $with`);
	return set(node, name, args);
}

/** A handle's trivia `side` read or written with `items`, through its row's `$trivia`. */
export function rowTrivia(node: RecordPosition, wrap: (data: object, tree: TreeHandle) => unknown, side: string, items: readonly unknown[]): unknown {
	return (rowOf(node, wrap).$trivia as Members)[side]!(...items);
}

/** A parsed leaf as read data: its kind, its coordinate (`coordinateAt`) and its text, which the tree answers each time it is asked (`TreeHandle.text`). */
export function leafData(tree: TreeHandle, kind: number, span: ByteSpan, row: number): object {
	const text = tree.text;
	if (text === undefined) throw new Error('a record view needs a tree that answers its text');
	return { $type: kind, $text: () => text(span), $_layout: { at: coordinateAt(tree, row, span) } };
}

function cellData(holder: RecordPosition, cell: RecordCell, word: number, item: number): unknown {
	const tree = holder.$tree;
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
			return recordStub(tree, cell.at);
		case 'unit':
			return cell.kind;
		case 'builtLeaf':
			if (tree.built === undefined) throw new Error('a parsed record holds no built cell');
			return tree.built.leafAt(cell.kind, { at: cell.offset, len: cell.len }, holder.$at, word, item);
		case 'builtText':
			if (tree.built === undefined) throw new Error('a parsed record holds no built cell');
			return tree.built.textOf(cell.offset, cell.len);
		case 'copiedLeaf':
			if (tree.built === undefined) throw new Error('a parsed record holds no built cell');
			return tree.built.copiedLeaf(cell);
	}
}

/** The value of the one-cell slot at the generated `word` offset of the record `holder` is at, as read data. */
export function recordSlot(holder: RecordPosition, word: number, width: number, inline = 0): unknown {
	return cellData(holder, slotCell(holder, word, width, inline), word, 0);
}

export function recordPresent(holder: RecordPosition, word: number, width: number, inline = 0): boolean {
	return slotCell(holder, word, width, inline).form !== 'absent';
}

function slotCell(holder: RecordPosition, word: number, width: number, inline: number): RecordCell {
	const { words, start, records } = holderWords(holder, word + width);
	return decodeCell(words.subarray(start + word, start + word + width), 0, records.format, inline, holder.$at + word);
}

/** The items of the list slot at the generated `word` offset of the record `holder` is at, each as read data. */
export function recordSlots(holder: RecordPosition, word: number, width: number, run?: number, inline = 0): readonly unknown[] {
	if (run === undefined) return [recordSlot(holder, word, width, inline)].filter((item) => item !== undefined);
	const { words, start, records } = holderWords(holder, word + width);
	const list = decodeListCell(words, start + word);
	if (list.len === 0) return [];
	const items = wordsAt(records, list.run, list.len * run);
	return Array.from({ length: list.len }, (_, n) => cellData(holder, decodeCell(items.words, items.start + n * run, records.format), word, n));
}

/** The number of items the list slot at the generated `word` offset of the record `holder` is at holds. */
export function recordLength(holder: RecordPosition, word: number, width: number, run?: number, inline = 0): number {
	if (run === undefined) return recordPresent(holder, word, width, inline) ? 1 : 0;
	const { words, start } = holderWords(holder, word + width);
	return decodeListCell(words, start + word).len;
}

/** Whether the presence bit at the generated `word` offset of the record `holder` is at is set. */
export function recordFlag(holder: RecordPosition, word: number, bit: number): boolean {
	const { words, start } = holderWords(holder, word + 1);
	return ((words[start + word]! >>> bit) & 1) === 1;
}

export function chosenSeparatorOf(node: object): unknown {
	return chosenListSetting(node, '_separator', recordSeparator);
}

function chosenDelimiterOf(node: object): unknown {
	return chosenListSetting(node, '_delimiter', recordDelimiter);
}

function chosenListSetting(node: object, key: '_delimiter' | '_separator', read: (holder: RecordPosition) => number | undefined): unknown {
	const own = (node as Record<string, unknown>)[key];
	return own !== undefined || !isRecordPosition(node) ? own : read(node);
}

export interface RefusedSlot {
	readonly storageKey: string;
	readonly accessor: string;
	readonly error: Error;
}

export function slotValuesOf(node: object, rows: readonly QuerySlotEntry[], refused?: (slot: RefusedSlot) => void): [storageKey: string, value: unknown][] {
	const members = node as Record<string, unknown>;
	const values = rows.flatMap(([accessor, , , storageKey]): [string, unknown][] => {
		const read = members[accessor];
		if (typeof read !== 'function' || read.length !== 0) {
			if (Object.hasOwn(node, storageKey)) throw new Error(`a node of kind ${String(members.$type)} stores ${storageKey}, but has no reader ${accessor}()`);
			return [];
		}
		if (refused === undefined) return [[storageKey, (read as () => unknown).call(node)]];
		try {
			return [[storageKey, (read as () => unknown).call(node)]];
		} catch (error) {
			refused({ storageKey, accessor, error: error as Error });
			return [];
		}
	});
	const delimiter = chosenDelimiterOf(node);
	if (typeof delimiter === 'number') values.push(['_delimiter', delimiter]);
	const chosen = chosenSeparatorOf(node);
	if (typeof chosen === 'number') values.push(['_separator', chosen]);
	return values;
}

export function builtInputs(node: object): BuilderInputs {
	if (!isRecordPosition(node)) throw new Error('a built row reads the record of a record handle');
	const tree = node.$tree;
	const kind = node.$type;
	const members = node as unknown as Record<string, unknown>;
	const inputs = builderInputs(treeSlotTable(tree)?.[kind] ?? [], treeStructureTable(tree)?.[kind], (accessor) => {
		const read = members[accessor];
		return typeof read === 'function' ? listed((read as () => unknown).call(node)) : undefined;
	});
	const settings = Object.entries({ delimiter: chosenDelimiterOf(node), separator: chosenSeparatorOf(node) }).filter(([, value]) => value !== undefined);
	return settings.length === 0 ? inputs : { ...inputs, options: { ...inputs.options, ...Object.fromEntries(settings) } };
}

function listed(value: unknown): unknown {
	if (value === null || typeof value !== 'object' || Array.isArray(value) || typeof (value as { readonly $type?: unknown }).$type === 'number') return value;
	return Symbol.iterator in value ? [...(value as Iterable<unknown>)] : value;
}

function engineSlotsOf(node: object): (kind: number) => readonly QuerySlotEntry[] {
	const tree = isRecordPosition(node) ? node.$tree : (builtRefOf(node)?.arena.tree ?? treeOf(node));
	const table = tree === undefined ? undefined : treeSlotTable(tree);
	return (kind) => table?.[kind] ?? [];
}

export function storedSlotValues(
	node: object,
	slotsOf: (kind: number) => readonly QuerySlotEntry[] = engineSlotsOf(node),
	refused?: (slot: RefusedSlot) => void
): [storageKey: string, value: unknown][] {
	if (recordOf(node) !== undefined) return slotValuesOf(node, slotsOf((node as { readonly $type: number }).$type), refused);
	return Object.entries(node).filter(([key]) => isStorageKey(key));
}
