import type { ByteSpan } from '@sittir/types';

/** The record codec's constants as an addon built with the `arena` feature exports them. */
export interface RecordCodecConstants {
	readonly CELL_TAG_ABSENT: number;
	readonly CELL_TAG_COORDINATE: number;
	readonly CELL_TAG_PARSED_LEAF: number;
	readonly CELL_TAG_CHILD: number;
	readonly CELL_TAG_UNIT: number;
	readonly CELL_TAG_BUILT_LEAF: number;
	readonly CELL_TAG_INLINE: number;
	readonly CELL_INLINE_HEADER_WORDS: number;
	readonly ARENA_CHUNK_SHIFT: number;
	readonly SIDE_FIELD_AT: number;
	readonly SIDE_WORDS_AT: number;
	readonly SIDE_FIELD_EDGES: number;
	readonly SIDE_WORDS_EDGES: number;
	readonly SIDE_FIELD_SPAN: number;
	readonly SIDE_WORDS_SPAN: number;
	readonly SIDE_FIELD_SIDES: number;
	readonly SIDE_WORDS_SIDES: number;
	readonly SIDE_FIELD_SEPARATOR: number;
	readonly SIDE_WORDS_SEPARATOR: number;
	readonly SIDE_FIELD_DELIMITER: number;
	readonly SIDE_FIELD_SEPARATOR_KIND: number;
}

/** A side record field before a list's delimiters setting: its mask bit and its words. */
export interface SideField {
	readonly bit: number;
	readonly words: number;
}

/** The cell tags and address packing a record's words are read with. */
export interface CellFormat {
	readonly absent: number;
	readonly coordinate: number;
	readonly parsedLeaf: number;
	readonly child: number;
	readonly unit: number;
	readonly builtLeaf: number;
	readonly inline: number;
	readonly inlineHeaderWords: number;
	readonly chunkShift: number;
	/** The side record's `at`, its first field: a parsed node's row, its subtree's end and its byte span. */
	readonly sideAt: SideField;
	/** The fields a side record holds before a list's delimiters setting, in its order, `at` first. */
	readonly sideBeforeDelimiter: readonly SideField[];
	readonly sideDelimiter: number;
	/** The side record's `sides`: the parsed node a built one stands for, by its tree, rows and byte span. */
	readonly sideSides: SideField;
	/** The mask bit of a list's chosen separator, the one word after its delimiters setting. */
	readonly sideSeparatorKind: number;
}

/** A parsed node's place as its record's side record stamps it. */
export interface SideRow {
	readonly index: number;
	readonly end: number;
	readonly span: ByteSpan;
}

/** One slot's cell, decoded. */
export type RecordCell =
	| { readonly form: 'absent' }
	| { readonly form: 'coordinate'; readonly kind: number; readonly index: number; readonly span: ByteSpan }
	| { readonly form: 'parsedLeaf'; readonly kind: number; readonly span: ByteSpan; readonly row: number }
	| { readonly form: 'parsedText'; readonly span: ByteSpan }
	| {
			readonly form: 'child';
			readonly kind: number;
			readonly at: number;
			readonly link: number | undefined;
			readonly changed: { readonly leading: boolean; readonly trailing: boolean };
	  }
	| { readonly form: 'unit'; readonly kind: number; readonly row: number | undefined }
	| {
			readonly form: 'builtLeaf';
			readonly kind: number;
			readonly offset: number;
			readonly len: number;
			readonly record: number;
	  }
	| { readonly form: 'builtText'; readonly offset: number; readonly len: number };

/** A list slot's cell: its run's address and the items in it. */
export interface RecordListCell {
	readonly run: number;
	readonly len: number;
}

const CODEC_KEYS = [
	'CELL_TAG_ABSENT',
	'CELL_TAG_COORDINATE',
	'CELL_TAG_PARSED_LEAF',
	'CELL_TAG_CHILD',
	'CELL_TAG_UNIT',
	'CELL_TAG_BUILT_LEAF',
	'CELL_TAG_INLINE',
	'CELL_INLINE_HEADER_WORDS',
	'ARENA_CHUNK_SHIFT',
	'SIDE_FIELD_AT',
	'SIDE_WORDS_AT',
	'SIDE_FIELD_EDGES',
	'SIDE_WORDS_EDGES',
	'SIDE_FIELD_SPAN',
	'SIDE_WORDS_SPAN',
	'SIDE_FIELD_SIDES',
	'SIDE_WORDS_SIDES',
	'SIDE_FIELD_SEPARATOR',
	'SIDE_WORDS_SEPARATOR',
	'SIDE_FIELD_DELIMITER',
	'SIDE_FIELD_SEPARATOR_KIND'
] as const satisfies readonly (keyof RecordCodecConstants)[];

/** The cell format of `native`, `undefined` for an addon built without the record codec. */
export function cellFormatOf(native: object): CellFormat | undefined {
	const exported = native as Partial<Record<(typeof CODEC_KEYS)[number], unknown>>;
	if (!CODEC_KEYS.every((key) => typeof exported[key] === 'number')) return undefined;
	const codec = exported as RecordCodecConstants;
	return {
		absent: codec.CELL_TAG_ABSENT,
		coordinate: codec.CELL_TAG_COORDINATE,
		parsedLeaf: codec.CELL_TAG_PARSED_LEAF,
		child: codec.CELL_TAG_CHILD,
		unit: codec.CELL_TAG_UNIT,
		builtLeaf: codec.CELL_TAG_BUILT_LEAF,
		inline: codec.CELL_TAG_INLINE,
		inlineHeaderWords: codec.CELL_INLINE_HEADER_WORDS,
		chunkShift: codec.ARENA_CHUNK_SHIFT,
		sideAt: { bit: codec.SIDE_FIELD_AT, words: codec.SIDE_WORDS_AT },
		sideBeforeDelimiter: [
			{ bit: codec.SIDE_FIELD_AT, words: codec.SIDE_WORDS_AT },
			{ bit: codec.SIDE_FIELD_EDGES, words: codec.SIDE_WORDS_EDGES },
			{ bit: codec.SIDE_FIELD_SPAN, words: codec.SIDE_WORDS_SPAN },
			{ bit: codec.SIDE_FIELD_SIDES, words: codec.SIDE_WORDS_SIDES },
			{ bit: codec.SIDE_FIELD_SEPARATOR, words: codec.SIDE_WORDS_SEPARATOR }
		],
		sideDelimiter: codec.SIDE_FIELD_DELIMITER,
		sideSides: { bit: codec.SIDE_FIELD_SIDES, words: codec.SIDE_WORDS_SIDES },
		sideSeparatorKind: codec.SIDE_FIELD_SEPARATOR_KIND
	};
}

/** The chunk a packed address names. */
export function chunkOf(address: number, format: CellFormat): number {
	return address >>> format.chunkShift;
}

/** The word within its chunk a packed address names. */
export function wordOf(address: number, format: CellFormat): number {
	return address & ((1 << format.chunkShift) - 1);
}

/** The address of `word` in `chunk`, packed as a cell holds it. */
export function addressOf(chunk: number, word: number, format: CellFormat): number {
	return ((chunk << format.chunkShift) | word) >>> 0;
}

function field(words: ArrayLike<number>, at: number, n: number, tag: number): number {
	const word = words[at + n];
	if (word === undefined) throw new Error(`a cell with tag ${tag} ends at word ${at + n}`);
	return word;
}

function spanAt(words: ArrayLike<number>, at: number, tag: number): ByteSpan {
	return { start: field(words, at, 2, tag), end: field(words, at, 3, tag) };
}

/**
 * The cell whose words start at `at` in `words`, as the native codec writes it.
 *
 * @throws When the tag is none the codec writes, or the cell runs past `words`.
 */
export function decodeCell(
	words: ArrayLike<number>,
	at: number,
	format: CellFormat,
	inline = 0,
	address = 0
): RecordCell {
	const tag = words[at];
	if (tag === undefined) throw new Error(`no cell at word ${at}`);
	if (tag === format.inline) {
		if (
			address === 0 ||
			inline < 2 ||
			at + format.inlineHeaderWords + inline > words.length ||
			wordOf(address, format) + format.inlineHeaderWords >= 2 ** format.chunkShift
		) {
			throw new Error(`inline cell at word ${at} exceeds its stamped capacity ${inline}`);
		}
		const changed = field(words, at, 1, tag);
		return {
			form: 'child',
			kind: field(words, at, format.inlineHeaderWords, tag),
			at: addressOf(chunkOf(address, format), wordOf(address, format) + format.inlineHeaderWords, format),
			link: undefined,
			changed: { leading: (changed & 1) !== 0, trailing: (changed & 2) !== 0 }
		};
	}
	const kind = (): number => field(words, at, 1, tag);
	switch (tag) {
		case format.absent:
			return { form: 'absent' };
		case format.coordinate:
			return {
				form: 'coordinate',
				kind: kind(),
				index: field(words, at, 2, tag),
				span: { start: field(words, at, 3, tag), end: field(words, at, 4, tag) }
			};
		case format.parsedLeaf:
			return kind() === 0
				? { form: 'parsedText', span: spanAt(words, at, tag) }
				: { form: 'parsedLeaf', kind: kind(), span: spanAt(words, at, tag), row: field(words, at, 4, tag) };
		case format.child: {
			const tree = field(words, at, 3, tag);
			const changed = field(words, at, 4, tag);
			return {
				form: 'child',
				kind: kind(),
				at: field(words, at, 2, tag),
				link: tree === 0 ? undefined : tree - 1,
				changed: { leading: (changed & 1) !== 0, trailing: (changed & 2) !== 0 }
			};
		}
		case format.unit: {
			const row = field(words, at, 2, tag);
			return { form: 'unit', kind: kind(), row: row === 0 ? undefined : row - 1 };
		}
		case format.builtLeaf: {
			const offset = field(words, at, 2, tag);
			const len = field(words, at, 3, tag);
			return kind() === 0
				? { form: 'builtText', offset, len }
				: { form: 'builtLeaf', kind: kind(), offset, len, record: field(words, at, 4, tag) };
		}
		default:
			throw new Error(`word ${at} holds cell tag ${tag}, which no record writer writes`);
	}
}

/** The list cell whose two words start at `at` in `words`. */
export function decodeListCell(words: ArrayLike<number>, at: number): RecordListCell {
	const run = words[at];
	const len = words[at + 1];
	if (run === undefined || len === undefined) throw new Error(`a list cell ends at word ${at + 1}`);
	return { run, len };
}

/** The row the side record at `at` in `words` stamps, `undefined` when it holds none. */
export function decodeSideRow(words: ArrayLike<number>, at: number, format: CellFormat): SideRow | undefined {
	const mask = words[at];
	if (mask === undefined) throw new Error(`no side record at word ${at}`);
	if ((mask & format.sideAt.bit) === 0) return undefined;
	const word = (n: number): number => {
		const value = words[at + n];
		if (value === undefined) throw new Error(`a side record's row ends at word ${at + n}`);
		return value;
	};
	return { index: word(1), end: word(2), span: { start: word(3), end: word(4) } };
}

/** A list's delimiters setting as the side record at `at` in `words` holds it, `undefined` when it holds none. */
export function decodeSideDelimiter(words: ArrayLike<number>, at: number, format: CellFormat): number | undefined {
	return sideListSetting(words, at, format, format.sideDelimiter, 'delimiters setting');
}

export function decodeSideSeparatorKind(words: ArrayLike<number>, at: number, format: CellFormat): number | undefined {
	return sideListSetting(words, at, format, format.sideSeparatorKind, 'chosen separator');
}

export function sideListSettingOffset(mask: number, format: CellFormat, bit: number): number {
	const before = format.sideBeforeDelimiter.reduce((sum, field) => sum + ((mask & field.bit) === 0 ? 0 : field.words), 1);
	return bit === format.sideDelimiter || (mask & format.sideDelimiter) === 0 ? before : before + 1;
}

function sideListSetting(words: ArrayLike<number>, at: number, format: CellFormat, bit: number, what: string): number | undefined {
	const mask = words[at];
	if (mask === undefined) throw new Error(`no side record at word ${at}`);
	if ((mask & bit) === 0) return undefined;
	const offset = sideListSettingOffset(mask, format, bit);
	const setting = words[at + offset];
	if (setting === undefined) throw new Error(`a side record's ${what} ends at word ${at + offset}`);
	return setting;
}
