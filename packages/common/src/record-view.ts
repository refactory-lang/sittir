import type { ByteSpan, NodeCoordinate, QuerySlotEntry } from '@sittir/types';
import { type ChunkWords, type RecordWords, type TreeHandle } from './read.ts';
import { blankArmStored } from './blank-arm.ts';
import { spelledMember } from './spelled.ts';
import { builtRefOf } from './built-ref.ts';
import { undoIfFillFails } from './list-fills.ts';
import { treeOf } from './tree-token.ts';
import { treeBuiltArena, treeSlotTable, treeStructureTable } from './engine-scope.ts';
import { decodeBuiltCell, type BuiltArena } from './built-arena.ts';
import { builderInputs, type BuilderInputs } from './builder-inputs.ts';
import {
	decodeListCell,
	decodeParsedCell,
	decodeSideDelimiter,
	decodeSideRow,
	decodeSideSeparatorKind,
	headerKind,
	sideListSettingOffset,
	wordOf,
	type CellSite,
	type RecordCell
} from './record-cell.ts';
import { asReadOutput, coordinateOf, holdReadTree, isStorageKey, type ReadOutput } from './node-data.ts';
import { isRecordPosition, type RecordHandle, type RecordPosition } from './handle.ts';

export function positionWords(position: RecordPosition): ChunkWords | undefined {
	const own = (position as Partial<RecordHandle>).$words;
	if (own !== undefined) return own;
	return recordsOf(position.$tree).words(position.$at, 2);
}

/** The address a record position or handle holds, `undefined` for any other value. */
export function recordOf(value: unknown): number | undefined {
	return isRecordPosition(value) ? value.$at : undefined;
}

function recordsOf(tree: TreeHandle): RecordWords {
	if (tree.built === undefined) throw new Error('a record view needs the handle a built arena reads through');
	return tree.built;
}

/** The words of the record at `at`, `length` of them, and where the record starts in them. */
function wordsAt(
	records: RecordWords,
	at: number,
	length: number
): { readonly words: ChunkWords; readonly start: number } {
	return { words: records.words(at, length), start: wordOf(at, records.format) };
}

export function freedRecord(at: number): string {
	return `the node at ${at} was released: the chunk its record was in is freed`;
}

export function liveWords(holder: RecordPosition): ChunkWords | undefined {
	const own = (holder as Partial<RecordHandle>).$words;
	if (own?.length !== 0) return own;
	throw new Error(freedRecord(holder.$at));
}

export function cacheOf(node: RecordHandle): Record<number, unknown> {
	liveWords(node);
	return (node.$cache ??= {});
}

function holderWords(holder: RecordPosition, length: number): { readonly words: ChunkWords; readonly start: number; readonly records: RecordWords } {
	const records = recordsOf(holder.$tree);
	return { words: liveWords(holder) ?? records.words(holder.$at, length), start: wordOf(holder.$at, records.format), records };
}

function sideWordsAt(records: RecordWords, side: number): { readonly words: ChunkWords; readonly start: number } {
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

/** The header kind of the record a read left at `at` of the built arena `tree`, with the span and the coordinate's kind its side record stamps. */
function readRow(tree: TreeHandle, at: number): { readonly kind: number; readonly span: ByteSpan; readonly stamped: number } {
	const records = recordsOf(tree);
	const { words, start } = wordsAt(records, at, 2);
	const kind = headerKind(words[start]!, records.format.kindBits);
	const side = words[start + 1]!;
	if (side === 0) throw new Error(`a read's record of kind ${kind} names no side record, so no span`);
	const sides = sideWordsAt(records, side);
	const row = decodeSideRow(sides.words, sides.start, records.format);
	if (row === undefined) throw new Error(`the side record of a read's record of kind ${kind} holds no span`);
	if (row.end !== 0) throw new Error(`the side record of a read's record of kind ${kind} names a row of a tree`);
	return { kind, span: row.span, stamped: row.index };
}

/** The record a read left at `at` of the built arena `tree` is, as a position: its kind, and its coordinate, which names it by its address. */
export function readPosition(tree: TreeHandle, at: number): RecordPosition {
	const { kind, span, stamped } = readRow(tree, at);
	return positionAt(tree, at, kind, { $node: at, $span: span, $type: stamped } as unknown as NodeCoordinate);
}

function positionAt(tree: TreeHandle, at: number, kind: number, coordinate: NodeCoordinate): RecordPosition {
	return { $type: kind, $tree: tree, $at: at, $_layout: { at: coordinate } };
}

export function recordDelimiter(holder: RecordPosition): number | undefined {
	return recordListSetting(holder, decodeSideDelimiter);
}

export function recordSeparator(holder: RecordPosition): number | undefined {
	return recordListSetting(holder, decodeSideSeparatorKind);
}

function recordListSetting(holder: RecordPosition, decode: (words: ChunkWords, at: number, format: RecordWords['format']) => number | undefined): number | undefined {
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
	undoIfFillFails(rows, node, undefined);
	rows.set(node, row);
	return row;
}

/** The read data of a read's record in the built arena whose kind has no view: its kind and source text. */
export function rowData(stub: RecordPosition): unknown {
	const at = coordinateOf(stub);
	if (at === undefined) throw new Error('a record view names no row');
	if (stub.$tree.built === undefined) throw new Error('a record view needs the handle a built arena reads through');
	return readLeaf(stub.$tree.built, stub.$at, stub.$type, at.$span, undefined);
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

/** The node the cell at `site` of the read's record at `holder` names, a node with no record of its own, or, with no site, the content sharing the record's own row, as read data: its kind, its text, which the arena answers each time it is asked, and its coordinate, which names it by its holder and site. */
export function readLeaf(arena: BuiltArena, holder: number, kind: number, span: ByteSpan, site: CellSite | undefined): ReadOutput {
	const at = site === undefined ? { $node: holder, $span: span, $type: readRow(arena.tree, holder).stamped } : { $node: holder, $site: site, $span: span, $type: kind };
	const leaf = asReadOutput({ $type: kind, $text: () => arena.readText(holder, span), $_layout: { at: at as unknown as NodeCoordinate } });
	holdReadTree(leaf, arena.token);
	return leaf;
}

function cellData(holder: RecordPosition, cell: RecordCell, word: number, item: number): unknown {
	const arena = holder.$tree.built;
	if (arena === undefined) throw new Error('a record view needs the handle a built arena reads through');
	switch (cell.form) {
		case 'absent':
			return undefined;
		case 'coordinate':
			throw new Error(`the record at ${holder.$at} names a node its read left unread, and a read leaves none`);
		case 'parsedLeaf':
			return readLeaf(arena, holder.$at, cell.kind, cell.span, cell.row === 1 ? undefined : [word, item]);
		case 'parsedText':
			return arena.readText(holder.$at, cell.span);
		case 'child':
			if (cell.link !== undefined) throw new Error(`the record at ${holder.$at} names a record of tree ${cell.link}, and a record names none`);
			return arena.node(cell.at);
		case 'unit':
			return cell.kind;
		case 'builtLeaf':
			return arena.leafAt(cell.kind, cell.offset, holder.$at, word, item);
		case 'builtText':
			return arena.entryText(arena.entryAt(cell.offset).entry);
		case 'linkedLeaf':
			return arena.linkedLeaf(cell);
	}
}

/** The value of the one-cell slot whose parsed cell is at `word`, `width` words holding `forms`, and whose built cell is `built`, of the record `holder` is at, as read data. */
export function recordSlot(holder: RecordPosition, word: number, width: number, forms: number, inline: number, built: number): unknown {
	return cellData(holder, slotCell(holder, word, width, forms, inline, built), word, 0);
}

export function recordPresent(holder: RecordPosition, word: number, width: number, forms: number, inline: number, built: number): boolean {
	return slotCell(holder, word, width, forms, inline, built).form !== 'absent';
}

function builtLayout(holder: RecordPosition): BuiltArena | undefined {
	const arena = holder.$tree.built;
	return arena === undefined || arena.reads(holder.$at) ? undefined : arena;
}

function slotCell(holder: RecordPosition, word: number, width: number, forms: number, inline: number, built: number): RecordCell {
	const arena = builtLayout(holder);
	if (arena !== undefined) {
		const { words, start } = holderWords(holder, built + 1);
		return decodeBuiltCell(arena, words[start + built]!);
	}
	const { words, start, records } = holderWords(holder, word + width);
	return decodeParsedCell(words.subarray(0, start + word + width), start + word, forms, records.format, inline, holder.$at + word);
}

/** The list one word of a holder names: the built cell `built` of a built record, else the parsed cell at `word`. */
function listOf(holder: RecordPosition, word: number, built: number): { readonly records: RecordWords; readonly run: number; readonly len: number } {
	const arena = builtLayout(holder);
	const at = arena === undefined ? word : built;
	const { words, start, records } = holderWords(holder, at + 1);
	const runs = arena ?? records;
	return { records: runs, ...decodeListCell(runs, words[start + at]!) };
}

function itemData(holder: RecordPosition, cell: RecordCell, word: number, item: number): unknown {
	return cell.form === 'absent' ? null : cellData(holder, cell, word, item);
}

/** The items of the list slot whose parsed cell is at `word`, each item's cell `run` words holding `forms`, and whose built cell is `built`, of the record `holder` is at, each as read data. */
export function recordSlots(holder: RecordPosition, word: number, width: number, run: number | undefined, forms: number, inline: number, built: number, hydrate?: (value: unknown) => unknown): readonly unknown[] {
	const mapped = (value: unknown): unknown => hydrate === undefined ? value : hydrate(value);
	if (run === undefined) {
		const value = recordSlot(holder, word, width, forms, inline, built);
		return value === undefined ? [] : [mapped(value)];
	}
	const arena = builtLayout(holder);
	const list = listOf(holder, word, built);
	if (list.len === 0) return [];
	if (arena !== undefined) {
		const items = wordsAt(arena, list.run, list.len);
		return Array.from({ length: list.len }, (_, n) => mapped(itemData(holder, decodeBuiltCell(arena, items.words[items.start + n]!), word, n)));
	}
	const items = wordsAt(list.records, list.run, list.len * run);
	return Array.from({ length: list.len }, (_, n) => mapped(itemData(holder, decodeParsedCell(items.words, items.start + n * run, forms, list.records.format), word, n)));
}

/** The number of items the list slot whose parsed cell is at `word` and whose built cell is `built` of the record `holder` is at holds. */
export function recordLength(holder: RecordPosition, word: number, width: number, run: number | undefined, forms: number, inline: number, built: number): number {
	if (run === undefined) return recordPresent(holder, word, width, forms, inline, built) ? 1 : 0;
	return listOf(holder, word, built).len;
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
	const values = rows.flatMap(([accessor, , , storageKey, , blank]): [string, unknown][] => {
		const stored = (value: unknown): unknown => (blank === true ? blankArmStored(value) : value);
		const read = members[accessor];
		if (typeof read !== 'function' || read.length !== 0) {
			if (Object.hasOwn(node, storageKey)) throw new Error(`a node of kind ${String(members.$type)} stores ${storageKey}, but has no reader ${accessor}()`);
			return [];
		}
		if (refused === undefined) return [[storageKey, stored((read as () => unknown).call(node))]];
		try {
			return [[storageKey, stored((read as () => unknown).call(node))]];
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
	const settings = listSettingsOf(node);
	return settings === undefined ? inputs : { ...inputs, options: { ...inputs.options, ...settings } };
}

export function listSettingsOf(node: object): Readonly<Record<string, unknown>> | undefined {
	const settings = Object.entries({ delimiter: chosenDelimiterOf(node), separator: chosenSeparatorOf(node) }).filter(([, value]) => value !== undefined);
	return settings.length === 0 ? undefined : Object.fromEntries(settings);
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
	const stored = Object.entries(node).filter(([key]) => isStorageKey(key));
	const kind = (node as { readonly $type?: unknown }).$type;
	if (typeof kind !== 'number' || !stored.some(([, value]) => typeof value === 'string')) return stored;
	const spellings = new Map(slotsOf(kind).flatMap((row) => (row[6] === undefined ? [] : [[row[3], row[6]] as const])));
	return spellings.size === 0 ? stored : stored.map(([key, value]) => [key, spelledMember(value, spellings.get(key))]);
}
