import type { ByteSpan } from '@sittir/types';
import { BLANK_KIND_ID, ERROR_KIND_ID } from './error-kind.ts';
import type { RecordWords } from './read.ts';

/** The record codec's constants as an addon built with the `arena` feature exports them. */
export interface RecordCodecConstants {
	readonly CELL_TAG_ABSENT: number;
	readonly CELL_TAG_NODE: number;
	readonly CELL_TAG_UNIT: number;
	readonly CELL_TAG_TEXT: number;
	readonly CELL_TAG_INLINE: number;
	readonly CELL_FORM_NODE: number;
	readonly CELL_FORM_UNIT: number;
	readonly CELL_FORM_TEXT: number;
	readonly CELL_FORM_INLINE: number;
	readonly CELL_FORM_BLANK: number;
	readonly CELL_LEAF_BIT: number;
	readonly CELL_BLANK_UNIT: number;
	readonly KIND_BITS: number;
	readonly RECORD_FLAG_LINK: number;
	readonly LINK_RECORD_WORDS: number;
	readonly COUNT_OWNED: number;
	readonly COUNT_SATURATED: number;
	readonly COUNT_SEGMENT: number;
	readonly HELD_RECORD: number;
	readonly HELD_RUN: number;
	readonly HELD_SIDE: number;
	readonly HELD_TEXT: number;
	readonly ARENA_CHUNK_SHIFT: number;
	readonly SIDE_FIELD_AT: number;
	readonly SIDE_WORDS_AT: number;
	readonly SIDE_FIELD_EDGES: number;
	readonly SIDE_WORDS_EDGES: number;
	readonly SIDE_FIELD_SPAN: number;
	readonly SIDE_WORDS_SPAN: number;
	readonly SIDE_FIELD_SIDES: number;
	readonly SIDE_WORDS_SIDES: number;
	readonly SIDE_FIELD_CHANGED_LEADING: number;
	readonly SIDE_FIELD_CHANGED_TRAILING: number;
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

/** The forms a parsed cell holds, as a slot's `forms` stamp names them. */
export interface CellForms {
	readonly node: number;
	readonly unit: number;
	readonly text: number;
	readonly inline: number;
	/** Not a form: the slot admits a choice's blank arm, which a read takes for no child, so a tagless unit cell of 0 is that arm. */
	readonly blank: number;
}

/** The cell tags and address packing a record's words are read with. */
export interface CellFormat {
	/** The tag word a parsed cell opens with when its slot holds more than one form. */
	readonly tag: { readonly absent: number; readonly node: number; readonly unit: number; readonly text: number; readonly inline: number };
	readonly forms: CellForms;
	/** The bit a node cell's span end carries for a leaf. */
	readonly leafBit: number;
	/** The chunk-0 offset a built blank arm's cell names: apart from word 0, an unset slot, and from every unit's kind. */
	readonly blankUnit: number;
	/** The bits a kind field takes, packed with its word's neighbours, in either arena. */
	readonly kindBits: number;
	/** The flag above a link record's kind field. */
	readonly linkFlag: number;
	readonly linkWords: number;
	readonly countOwned: number;
	readonly countSaturated: number;
	readonly countSegment: number;
	readonly held: { readonly record: number; readonly run: number; readonly side: number; readonly text: number };
	readonly chunkShift: number;
	/** The side record's `at`, its first field: a parsed node's row, its subtree's end and its byte span. */
	readonly sideAt: SideField;
	/** The fields a side record holds before a list's delimiters setting, in its order, `at` first. */
	readonly sideBeforeDelimiter: readonly SideField[];
	readonly sideDelimiter: number;
	/** The side record's `sides`: the parsed node a built one stands for, by its tree, rows and byte span. */
	readonly sideSides: SideField;
	readonly sideChanged: { readonly leading: number; readonly trailing: number };
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
			readonly changed: { readonly leading: boolean; readonly trailing: boolean };
	  }
	| { readonly form: 'builtText'; readonly offset: number; readonly len: number }
	| {
			readonly form: 'linkedLeaf';
			readonly kind: number;
			readonly at: number;
			readonly tree: number;
			readonly row: number;
			readonly end: number;
			readonly span: ByteSpan;
			readonly changed: { readonly leading: boolean; readonly trailing: boolean };
	  };

/** A list slot's cell: the address of its run's first item and the items in it. */
export interface RecordListCell {
	readonly run: number;
	readonly len: number;
}

const CODEC_KEYS = [
	'CELL_TAG_ABSENT',
	'CELL_TAG_NODE',
	'CELL_TAG_UNIT',
	'CELL_TAG_TEXT',
	'CELL_TAG_INLINE',
	'CELL_FORM_NODE',
	'CELL_FORM_UNIT',
	'CELL_FORM_TEXT',
	'CELL_FORM_INLINE',
	'CELL_FORM_BLANK',
	'CELL_LEAF_BIT',
	'CELL_BLANK_UNIT',
	'KIND_BITS',
	'RECORD_FLAG_LINK',
	'LINK_RECORD_WORDS',
	'COUNT_OWNED',
	'COUNT_SATURATED',
	'COUNT_SEGMENT',
	'HELD_RECORD',
	'HELD_RUN',
	'HELD_SIDE',
	'HELD_TEXT',
	'ARENA_CHUNK_SHIFT',
	'SIDE_FIELD_AT',
	'SIDE_WORDS_AT',
	'SIDE_FIELD_EDGES',
	'SIDE_WORDS_EDGES',
	'SIDE_FIELD_SPAN',
	'SIDE_WORDS_SPAN',
	'SIDE_FIELD_SIDES',
	'SIDE_WORDS_SIDES',
	'SIDE_FIELD_CHANGED_LEADING',
	'SIDE_FIELD_CHANGED_TRAILING',
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
		tag: { absent: codec.CELL_TAG_ABSENT, node: codec.CELL_TAG_NODE, unit: codec.CELL_TAG_UNIT, text: codec.CELL_TAG_TEXT, inline: codec.CELL_TAG_INLINE },
		forms: { node: codec.CELL_FORM_NODE, unit: codec.CELL_FORM_UNIT, text: codec.CELL_FORM_TEXT, inline: codec.CELL_FORM_INLINE, blank: codec.CELL_FORM_BLANK },
		leafBit: codec.CELL_LEAF_BIT,
		blankUnit: codec.CELL_BLANK_UNIT,
		kindBits: codec.KIND_BITS,
		linkFlag: codec.RECORD_FLAG_LINK,
		linkWords: codec.LINK_RECORD_WORDS,
		countOwned: codec.COUNT_OWNED,
		countSaturated: codec.COUNT_SATURATED,
		countSegment: codec.COUNT_SEGMENT,
		held: { record: codec.HELD_RECORD, run: codec.HELD_RUN, side: codec.HELD_SIDE, text: codec.HELD_TEXT },
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
		sideChanged: { leading: codec.SIDE_FIELD_CHANGED_LEADING, trailing: codec.SIDE_FIELD_CHANGED_TRAILING },
		sideSeparatorKind: codec.SIDE_FIELD_SEPARATOR_KIND
	};
}

/** The kind a packed kind field of `bits` bits in `word` holds: all-ones is `ERROR`. */
export function kindField(word: number, bits: number): number {
	const mask = 2 ** bits - 1;
	const kind = word & mask;
	return kind === mask ? ERROR_KIND_ID : kind;
}

/** `kind` as a kind field of `bits` bits. */
export function withKind(kind: number, bits: number): number {
	const mask = 2 ** bits - 1;
	if (kind === ERROR_KIND_ID) return mask;
	if (!Number.isInteger(kind) || kind < 0 || kind >= mask) throw new Error(`kind ${kind} does not fit a ${bits}-bit kind field`);
	return kind;
}

/** The kind a record header word names, refusing a header with flags: a link record's, which names a node of another tree. */
export function headerKind(word: number, bits: number): number {
	if (word >>> bits !== 0) throw new Error(`a record header holds flags ${word >>> bits}: a link record is no record of its own arena`);
	return kindField(word, bits);
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

/** Whether a parsed cell of `forms` opens with a tag word: its slot holds more than one form, the blank flag left out. */
export function isTagged(forms: number, format: CellFormat): boolean {
	const named = forms & ~format.forms.blank;
	return (named & (named - 1)) !== 0;
}

function taggedForm(tag: number, at: number, format: CellFormat): number {
	const { tag: tags, forms } = format;
	switch (tag) {
		case tags.node:
			return forms.node;
		case tags.unit:
			return forms.unit;
		case tags.text:
			return forms.text;
		case tags.inline:
			return forms.inline;
		default:
			throw new Error(`word ${at} holds cell tag ${tag}, which no record writer writes`);
	}
}

function packed(word: number, at: number, format: CellFormat): { readonly kind: number; readonly row: number } {
	const kind = kindField(word, format.kindBits);
	const row = word >>> format.kindBits;
	if (kind === 0 || kind === ERROR_KIND_ID || row === 0) throw new Error(`word ${at} packs kind ${kind} and row ${row}, which no parsed cell holds`);
	return { kind, row };
}

function parsedRecord(first: number, address: number, end: number, at: number, format: CellFormat): RecordCell {
	const kind = kindField(first, format.kindBits);
	if (kind === BLANK_KIND_ID || kind === ERROR_KIND_ID || address === 0 || end !== 0) throw new Error(`word ${at} names record ${address} of kind ${kind}, which no parsed cell holds`);
	return { form: 'child', kind, at: address, link: undefined, changed: { leading: false, trailing: false } };
}

/**
 * The parsed cell of a slot of `forms` whose words start at `at` in `words`, as the native hydration writes it. A bounded child's embedded record is read where it lies: `address` is the cell's own address, and `inline` the words its slot stamps for it.
 *
 * @throws When the cell holds a tag or a form its slot does not, a kind or row no parsed cell holds, or runs past `words`.
 */
export function decodeParsedCell(words: ArrayLike<number>, at: number, forms: number, format: CellFormat, inline = 0, address = 0): RecordCell {
	const first = words[at];
	if (first === undefined) throw new Error(`no cell at word ${at}`);
	const tagged = isTagged(forms, format);
	if (tagged && first === format.tag.absent) return { form: 'absent' };
	const form = tagged ? taggedForm(first, at, format) : forms & ~format.forms.blank;
	if ((forms & form) === 0) throw new Error(`word ${at} holds a cell of form ${form}, which its slot of forms ${forms} does not hold`);
	const start = tagged ? at + 1 : at;
	const word = (n: number): number => {
		const value = words[start + n];
		if (value === undefined) throw new Error(`a cell at word ${at} ends at word ${start + n}`);
		return value;
	};
	if (form === format.forms.unit && (forms & format.forms.blank) !== 0 && word(0) === 0) return { form: 'unit', kind: BLANK_KIND_ID, row: undefined };
	if (!tagged && first === 0) return { form: 'absent' };
	switch (form) {
		case format.forms.node: {
			if (word(0) >>> format.kindBits === 0) return parsedRecord(word(0), word(1), word(2), at, format);
			const { kind, row } = packed(word(0), at, format);
			const end = word(2);
			const span = { start: word(1), end: (end & ~format.leafBit) >>> 0 };
			return (end & format.leafBit) === 0 ? { form: 'coordinate', kind, index: row, span } : { form: 'parsedLeaf', kind, span, row };
		}
		case format.forms.unit:
			return { form: 'unit', ...packed(word(0), at, format) };
		case format.forms.text: {
			const end = word(1);
			if ((end & format.leafBit) !== 0) throw new Error(`a text cell at word ${at} ends at ${end >>> 0}, which no span does`);
			return { form: 'parsedText', span: { start: word(0) - 1, end } };
		}
		case format.forms.inline: {
			const offset = start - at;
			if (address === 0 || inline < 2 || start + inline > words.length || wordOf(address, format) + offset + inline > 2 ** format.chunkShift) {
				throw new Error(`inline cell at word ${at} exceeds its stamped capacity ${inline}`);
			}
			return {
				form: 'child',
				kind: headerKind(word(0), format.kindBits),
				at: addressOf(chunkOf(address, format), wordOf(address, format) + offset, format),
				link: undefined,
				changed: { leading: false, trailing: false }
			};
		}
		default:
			throw new Error(`a slot of forms ${forms} names no form a parsed cell holds`);
	}
}

/**
 * The list a list slot's one word names in `records`: its run's first item and the items in it. A run opens with its length; 0 is the empty list.
 *
 * @throws When the word marks changed edges, or names a run of no items.
 */
export function decodeListCell(records: RecordWords, word: number): RecordListCell {
	if (word === 0) return { run: 0, len: 0 };
	if ((word & 3) !== 0) throw new Error(`a list cell ${word} marks changed edges`);
	const at = word >>> 2;
	const len = records.words(at, 1)[wordOf(at, records.format)]!;
	if (len === 0) throw new Error('a list cell names a run of no items');
	return { run: at + 1, len };
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
