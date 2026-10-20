import type { ByteSpan } from '@sittir/types';

/** The record codec's constants as an addon built with the `arena` feature exports them. */
export interface RecordCodecConstants {
	readonly CELL_TAG_ABSENT: number;
	readonly CELL_TAG_COORDINATE: number;
	readonly CELL_TAG_PARSED_LEAF: number;
	readonly CELL_TAG_CHILD: number;
	readonly CELL_TAG_UNIT: number;
	readonly CELL_TAG_BUILT_LEAF: number;
	readonly ARENA_CHUNK_SHIFT: number;
}

/** The cell tags and address packing a record's words are read with. */
export interface CellFormat {
	readonly absent: number;
	readonly coordinate: number;
	readonly parsedLeaf: number;
	readonly child: number;
	readonly unit: number;
	readonly builtLeaf: number;
	readonly chunkShift: number;
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
	| { readonly form: 'builtLeaf'; readonly kind: number; readonly offset: number; readonly len: number; readonly record: number }
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
	'ARENA_CHUNK_SHIFT'
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
		chunkShift: codec.ARENA_CHUNK_SHIFT
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
export function decodeCell(words: ArrayLike<number>, at: number, format: CellFormat): RecordCell {
	const tag = words[at];
	if (tag === undefined) throw new Error(`no cell at word ${at}`);
	const kind = (): number => field(words, at, 1, tag);
	switch (tag) {
		case format.absent:
			return { form: 'absent' };
		case format.coordinate:
			return { form: 'coordinate', kind: kind(), index: field(words, at, 2, tag), span: { start: field(words, at, 3, tag), end: field(words, at, 4, tag) } };
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
