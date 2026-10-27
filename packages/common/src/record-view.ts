import type { ByteSpan, NodeCoordinate, QuerySlotEntry } from '@sittir/types';
import { decodeIndex, encodeHandle, type RecordReader, type RecordWords, type TreeHandle } from './read.ts';
import { builtRefOf } from './built-ref.ts';
import { treeOf } from './tree-token.ts';
import { treeBuiltArena, treeSlotTable, treeStructureTable } from './engine-scope.ts';
import type { BuiltArena } from './built-arena.ts';
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

/** The own key of a record stub and of the view made from it: the record's address. */
export const RECORD = Symbol.for('sittir.record');

export const SLOTS = Symbol.for('sittir.slots');

export const SEEDS = Symbol.for('sittir.seeds');

export type KeptSlots = Record<number, unknown>;

export type SeededSlots = Readonly<KeptSlots>;

/** A record as the read returns it, before the wrap table makes it a view: its kind, its address and its coordinate. */
export interface RecordStub {
	readonly $type: number;
	readonly [RECORD]: number;
	readonly $_layout: { readonly at: NodeCoordinate };
	readonly [SEEDS]?: SeededSlots;
	[SLOTS]?: KeptSlots;
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

/** The record at `at` of `tree` as a stub: its kind and its coordinate, read from its own words. */
export function recordStub(tree: TreeHandle, at: number): RecordStub {
	const records = parsedRecordsOf(tree);
	const { words, start } = wordsAt(records, at, 2);
	const kind = words[start]!;
	return { $type: kind, [RECORD]: at, $_layout: { at: rowCoordinate(tree, records, words[start + 1]!, kind) }, [SLOTS]: undefined };
}

export function recordDelimiter(holder: object, tree: TreeHandle): number | undefined {
	return recordListSetting(holder, tree, decodeSideDelimiter);
}

export function recordSeparator(holder: object, tree: TreeHandle): number | undefined {
	return recordListSetting(holder, tree, decodeSideSeparatorKind);
}

function recordListSetting(holder: object, tree: TreeHandle, decode: (words: Uint32Array, at: number, format: RecordWords['format']) => number | undefined): number | undefined {
	const at = recordOf(holder);
	if (at === undefined) throw new Error('a record option read needs a record view');
	const records = recordsOf(tree);
	const side = sideOf(records, at);
	if (side === 0) return undefined;
	const { words, start } = sideWordsAt(records, side);
	return decode(words, start, records.format);
}

const rows = new WeakMap<object, Record<string, unknown>>();

export function rowOf(
	node: object,
	tree: TreeHandle,
	wrap: (data: object, tree: TreeHandle) => unknown
): Record<string, unknown> {
	const known = rows.get(node);
	if (known !== undefined) return known;
	const row = tree.built === undefined ? (wrap(rowData(node, tree) as object, tree) as Record<string, unknown>) : tree.built.row(node);
	rows.set(node, row);
	return row;
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
	const built = tree.built === undefined ? treeBuiltArena(tree) : undefined;
	return ((built === undefined ? rowOf(node, tree, wrap) : builtRowOf(node, built)).$with as Members)[name]!(...args);
}

const builtRows = new WeakMap<object, Record<string, unknown>>();

function builtRowOf(node: object, arena: BuiltArena): Record<string, unknown> {
	const known = builtRows.get(node);
	if (known !== undefined) return known;
	const row = arena.row(node);
	builtRows.set(node, row);
	return row;
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
export function leafData(tree: TreeHandle, kind: number, span: ByteSpan, row: number): object {
	const text = tree.text;
	if (text === undefined) throw new Error('a record view needs a tree that answers its text');
	return { $type: kind, $text: () => text(span), $_layout: { at: coordinateAt(tree, row, span) } };
}

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
			throw new Error(tree.built === undefined ? 'a parsed record holds no built cell' : 'a built leaf is read from the holder that keeps it');
		case 'builtText':
			if (tree.built === undefined) throw new Error('a parsed record holds no built cell');
			return tree.built.textOf(cell.offset, cell.len);
		case 'copiedLeaf':
			if (tree.built === undefined) throw new Error('a parsed record holds no built cell');
			return tree.built.copiedLeaf(cell);
	}
}

/** The value of the one-cell slot at the generated `word` offset of the record `holder` views, as read data. */
export function recordSlot(holder: object, tree: TreeHandle, word: number, width: number, inline = 0): unknown {
	return cellData(holder, tree, slotCell(holder, tree, word, width, inline));
}

export function recordPresent(holder: object, tree: TreeHandle, word: number, width: number, inline = 0): boolean {
	return slotCell(holder, tree, word, width, inline).form !== 'absent';
}

function slotCell(holder: object, tree: TreeHandle, word: number, width: number, inline: number): RecordCell {
	const at = recordOf(holder);
	if (at === undefined) throw new Error('a record slot read needs a record view');
	const records = recordsOf(tree);
	const { words, start } = wordsAt(records, at, word + width);
	return decodeCell(words.subarray(start + word, start + word + width), 0, records.format, inline, at + word);
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

/** The number of items the list slot at the generated `word` offset of the record `holder` views holds. */
export function recordLength(
	holder: object,
	tree: TreeHandle,
	word: number,
	width: number,
	run?: number,
	inline = 0
): number {
	if (run === undefined) return recordPresent(holder, tree, word, width, inline) ? 1 : 0;
	const at = recordOf(holder);
	if (at === undefined) throw new Error('a record slot read needs a record view');
	const { words, start } = wordsAt(recordsOf(tree), at, word + width);
	return decodeListCell(words, start + word).len;
}

/** Whether the presence bit at the generated `word` offset of the record `holder` views is set. */
export function recordFlag(holder: object, tree: TreeHandle, word: number, bit: number): boolean {
	const at = recordOf(holder);
	if (at === undefined) throw new Error('a record slot read needs a record view');
	const { words, start } = wordsAt(recordsOf(tree), at, word + 1);
	return ((words[start + word]! >>> bit) & 1) === 1;
}

export function chosenSeparatorOf(node: object): unknown {
	return chosenListSetting(node, '_separator', recordSeparator);
}

function chosenDelimiterOf(node: object): unknown {
	return chosenListSetting(node, '_delimiter', recordDelimiter);
}

function chosenListSetting(node: object, key: '_delimiter' | '_separator', read: (holder: object, tree: TreeHandle) => number | undefined): unknown {
	const own = (node as Record<string, unknown>)[key];
	if (own !== undefined || recordOf(node) === undefined) return own;
	const tree = viewTreeOf(node);
	return tree === undefined ? undefined : read(node, tree);
}

function viewTreeOf(node: object): TreeHandle | undefined {
	return builtRefOf(node)?.arena.tree ?? treeOf(node);
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
	const tree = recordOf(node) === undefined ? undefined : viewTreeOf(node);
	if (tree === undefined) throw new Error('a built row reads the record of a record view');
	const kind = (node as { readonly $type: number }).$type;
	const members = node as Record<string, unknown>;
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
	const tree = builtRefOf(node)?.arena.tree ?? treeOf(node);
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
